import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import jwt
import bcrypt
import datetime
import time
from inspect import signature
from functools import wraps
from google import genai

from src.energy.storage import EnergyDB, EnergyDBConfig
from src.asaase import init_asaase
from src.asaase.logger import app_logger, api_logger

app = Flask(__name__, static_folder='dashboard/dist', static_url_path='/')
CORS(app)  # Enable CORS for React development server

# Initialize ASAASE Robot Control System
app_logger.info("Initializing ASAASE Robot Control System...")
init_asaase(app)

DB_PATH = os.path.join(os.getcwd(), "runs", "data.db")
ENERGY_DB_PATH = os.path.join(os.getcwd(), "runs", "energy.db")
SECRET_KEY = os.environ.get("JWT_SECRET", "super-secret-key")

# Ensure database schema and default users exist on startup
from src.storage.sqlite_store import SQLiteStore, StoreConfig
SQLiteStore(StoreConfig(path=DB_PATH)).close()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith("Bearer "):
            return jsonify({'message': 'Token missing'}), 401
        try:
            jwt.decode(token.split(" ")[1], SECRET_KEY, algorithms=["HS256"])
        except Exception:
            return jsonify({'message': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

def get_db_connection(path=DB_PATH):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    conn = get_db_connection(DB_PATH)
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        token = jwt.encode({
            'user': username,
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({'token': token})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token():
    return jsonify({'status': 'valid'})

@app.route('/api/latest-stats')
def get_latest_stats():
    # Latest Environment Frame
    env_frame = None
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        env_frame = conn.execute('SELECT * FROM env_frames ORDER BY ts DESC LIMIT 1').fetchone()
        water_reading = conn.execute('SELECT * FROM water_readings ORDER BY ts DESC LIMIT 1').fetchone()
        conn.close()
    else:
        water_reading = None

    # Latest Filtration
    filtration = None
    filt_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    if os.path.exists(filt_path):
        with open(filt_path, 'r') as f:
            filtration = json.load(f)

    # Latest Energy
    energy = None
    if os.path.exists(ENERGY_DB_PATH):
        edb = EnergyDB(EnergyDBConfig(path=ENERGY_DB_PATH))
        energy = edb.get_day_stats()
        edb.close()
    
    # Latest Distribution
    distribution = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        rows = conn.execute('''
            SELECT e.* FROM distribution_events e
            INNER JOIN (
                SELECT home, MAX(ts) as max_ts FROM distribution_events GROUP BY home
            ) latest ON e.home = latest.home AND e.ts = latest.max_ts
        ''').fetchall()
        conn.close()
        distribution = [dict(row) for row in rows]
    
    stats = {
        "env": dict(env_frame) if env_frame else None,
        "water": dict(water_reading) if water_reading else None,
        "filtration": filtration,
        "energy": energy,
        "distribution": distribution,
        "health": None # Calculated below
    }


    stats['health'] = calculate_health_score(stats['env'], stats['water'], stats['filtration'], stats['energy'], stats['distribution'])

    
    return jsonify(stats)

def calculate_health_score(env, water, filtration, energy, distribution):

    score = 100.0
    reasons = []
    
    # Water Quality (30%)
    if water:
        # pH penalty (6.5 - 8.5 ideal)
        ph = water['ph']
        if ph < 6.5 or ph > 8.5:
            penalty = min(15, abs(ph - 7.5) * 10)
            score -= penalty
            reasons.append(f"pH out of range ({ph})")
        
        # Temp penalty (ideal < 25C)
        temp = water['temperature_c']
        if temp > 25:
            penalty = min(15, (temp - 25) * 2)
            score -= penalty
            reasons.append(f"High water temperature ({temp}C)")

    # Filtration (40%)
    if filtration:
        clog = filtration.get('telemetry', {}).get('bottle_clog_pct', 0)
        net = filtration.get('telemetry', {}).get('net_load_pct', 0)
        if clog > 70:
            score -= 20
            reasons.append(f"High filter clogging ({clog}%)")
        if net > 80:
            score -= 10
            reasons.append(f"Nets near capacity ({net}%)")
        
        if filtration.get('state') != 'FILTERING':
            score -= 5
            reasons.append(f"System in maintenance mode: {filtration.get('state')}")

    # Energy Efficiency (30%)
    if energy and filtration:
        flow = filtration.get('telemetry', {}).get('flow_lpm', 0)
        power = energy.get('avg_power_w', 0)
        # Expected power: ~3.3W per LPM (150W / 45LPM)
        expected = flow * 3.3
        if expected > 0:
            efficiency = power / expected
            if efficiency < 0.8:
                score -= 15
                reasons.append(f"Low turbine efficiency ({efficiency*100:.1f}%)")

    # Distribution Fulfillment (Punts if no distribution data provided)
    if distribution:
        # Sum of actual volumes vs expected
        # Expected is ~33 LPM total (10+15+8)
        total_delivered = sum(d['volume_liters'] * 60 for d in distribution)
        if total_delivered < 25:
            penalty = min(20, (30 - total_delivered) * 2)
            score -= penalty
            reasons.append(f"Insufficient water distribution ({total_delivered:.1f} LPM)")

    return {

        "score": max(0, round(score, 1)),
        "status": "EXCELLENT" if score > 90 else "GOOD" if score > 75 else "WARNING" if score > 50 else "CRITICAL",
        "reasons": reasons
    }

@app.route('/api/system-health')
def get_system_health():
    # Fetch all data and calculate
    latest = get_latest_stats().get_json()
    return jsonify(latest['health'])

@app.route('/api/history')
def get_history():
    env_history = []
    water_history = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        env_history = conn.execute('SELECT ts, green_ratio FROM env_frames ORDER BY ts DESC LIMIT 20').fetchall()
        water_history = conn.execute('SELECT ts, ph, temperature_c FROM water_readings ORDER BY ts DESC LIMIT 20').fetchall()
        conn.close()
    
    return jsonify({
        "env": [dict(row) for row in env_history],
        "water": [dict(row) for row in water_history]
    })

@app.route('/api/energy-history')
def get_energy_history():
    samples = []
    if os.path.exists(ENERGY_DB_PATH):
        conn = get_db_connection(ENERGY_DB_PATH)
        rows = conn.execute('SELECT ts, power_w, rpm FROM turbine_samples ORDER BY ts DESC LIMIT 30').fetchall()
        conn.close()
        samples = [dict(row) for row in rows]
    return jsonify(samples)

@app.route('/api/distribution/latest')
def get_distribution_latest():
    events = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        # Get latest event for each home
        rows = conn.execute('''
            SELECT e.* FROM distribution_events e
            INNER JOIN (
                SELECT home, MAX(ts) as max_ts FROM distribution_events GROUP BY home
            ) latest ON e.home = latest.home AND e.ts = latest.max_ts
        ''').fetchall()
        conn.close()
        events = [dict(row) for row in rows]
    return jsonify(events)

@app.route('/api/distribution/history')
def get_distribution_history():
    history = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        rows = conn.execute('SELECT day, total_volume_liters FROM distribution_daily ORDER BY day DESC LIMIT 7').fetchall()
        conn.close()
        history = [dict(row) for row in rows]
    return jsonify(history)

@app.route('/api/filtration')
def get_filtration():
    path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    if os.path.exists(path):
        with open(path, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({"error": "Filtration data not available"}), 404

@app.route('/api/control/<action>', methods=['POST'])
@token_required
def system_control(action):
    # In a real scenario, this writes to a hardware command queue
    # For now, we update the local filtration state json directly to reflect changes
    # Ensure this is an authenticated action.
    print(f"AUTHENTICATED CONTROL RECEIVED: {action}")
    
    filt_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    if os.path.exists(filt_path):
        with open(filt_path, 'r') as f:
            data = json.load(f)
            if action == 'net-clear':
                data['state'] = 'CLEAR_NETS'
            elif action == 'backwash':
                data['state'] = 'BACKWASH'
            
        with open(filt_path, 'w') as f:
            json.dump(data, f)
            
    return jsonify({"status": "success", "action": action})

@app.route('/api/ingest/water', methods=['POST'])
def ingest_water():
    data = request.json
    conn = get_db_connection(DB_PATH)
    conn.execute(
        "INSERT INTO water_readings (ts, ph, turbidity_ntu, temperature_c, dissolved_oxygen_mgL, alerts, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (time.time(), data.get('ph'), data.get('turbidity_ntu'), data.get('temperature_c'), data.get('dissolved_oxygen_mgL'), "{}", "{}")
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/ingest/energy', methods=['POST'])
def ingest_energy():
    data = request.json
    edb = EnergyDB(EnergyDBConfig(path=ENERGY_DB_PATH))
    edb.add_sample(data.get('ts', time.time()), data.get('power_w'), data.get('rpm'))
    edb.close()
    return jsonify({"status": "success"})
    
@app.route('/api/forecast', methods=['GET'])
@token_required
def get_forecast():
    conn = get_db_connection(DB_PATH)
    water_readings = conn.execute('SELECT * FROM water_readings ORDER BY ts DESC LIMIT 10').fetchall()
    conn.close()
    
    recent_water = [dict(w) for w in water_readings]
    
    filt_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    filtration = {}
    if os.path.exists(filt_path):
        try:
            with open(filt_path, 'r') as f:
                filtration = json.load(f)
        except Exception:
            pass
            
    prompt = f"""
    Analyze the recent sensor readings and filtration status of this water management system and provide a maintenance forecast.
    Return ONLY a JSON object with this exact structure, no markdown formatting:
    {{
        "predicted_hours_until_clog": <number>,
        "predicted_hours_until_net_full": <number>,
        "urgency": "<STABLE | WARNING | CRITICAL>",
        "recommendation_summary": "<string>",
        "confidence_score": <number 0-100>
    }}
    
    Recent Water Context: {json.dumps(recent_water)}
    Filtration Status: {json.dumps(filtration)}
    """
    
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            # Parse JSON from LLM response
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]
            return jsonify(json.loads(text))
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            # Fall through to fallback below
    
    # Fallback to intelligent estimate if LLM fails or API key is missing
    clog = filtration.get('telemetry', {}).get('bottle_clog_pct', 0)
    net = filtration.get('telemetry', {}).get('net_load_pct', 0)
    hours_clog = max(0, int((100 - clog) * 0.5))
    hours_net = max(0, int((100 - net) * 0.8))
    min_hours = min(hours_clog, hours_net)
    
    return jsonify({
        "predicted_hours_until_clog": hours_clog,
        "predicted_hours_until_net_full": hours_net,
        "urgency": "CRITICAL" if min_hours < 24 else "WARNING" if min_hours < 72 else "STABLE",
        "recommendation_summary": "Intelligent estimate: Scheduled backwash suggested soon based on capacity." if not gemini_key else "Fallback calculation: Scheduled backwash suggested soon based on capacity.",
        "confidence_score": 60
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Ensure the database directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    app.run(port=5000, host='0.0.0.0', debug=True)
