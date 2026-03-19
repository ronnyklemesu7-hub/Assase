from flask import Blueprint, jsonify, request
import os
import json
import time
import psutil
from src.asaase.db import get_db_connection, save_waypoints, get_robot_settings, set_robot_mode, set_robot_manual_command
from src.asaase.radio_listener import robot_last_seen, send_radio_command
from src.asaase.logger import api_logger

asaase_bp = Blueprint('asaase', __name__)

def validate_robot_id(robot_id):
    if not robot_id or not isinstance(robot_id, str):
        return False
    if not (robot_id.startswith("GROUND_") or robot_id.startswith("AQUA_")):
        return False
    return True

@asaase_bp.route('/ground/latest', methods=['GET'])
def get_ground_latest():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM ground_telemetry ORDER BY ts DESC LIMIT 50").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/ground/heatmap', methods=['GET'])
def get_ground_heatmap():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM ground_telemetry WHERE soil_classification IN ('MODERATE', 'CRITICAL')").fetchall()
    conn.close()
    
    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row['gps_lon'], row['gps_lat']]},
            "properties": {
                "severity": row['soil_classification'],
                "ts": row['ts'],
                "confidence_score": row['confidence_score'],
                "dispenser_action": row['dispenser_action']
            }
        })
    return jsonify({"type": "FeatureCollection", "features": features})

@asaase_bp.route('/aqua/latest', methods=['GET'])
def get_aqua_latest():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM aqua_telemetry ORDER BY ts DESC LIMIT 50").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/ground/history', methods=['GET'])
def get_ground_history():
    conn = get_db_connection()
    cutoff = time.time() - 86400
    rows = conn.execute("SELECT ts, confidence_score, battery_pct FROM ground_telemetry WHERE ts > ? ORDER BY ts ASC", (cutoff,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/aqua/history', methods=['GET'])
def get_aqua_history():
    conn = get_db_connection()
    cutoff = time.time() - 86400
    rows = conn.execute("SELECT ts, turbidity_ntu, ph_value, battery_pct FROM aqua_telemetry WHERE ts > ? ORDER BY ts ASC", (cutoff,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/aqua/heatmap', methods=['GET'])
def get_aqua_heatmap():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM aqua_telemetry WHERE dual_stream_verdict IN ('MODERATE', 'CRITICAL')").fetchall()
    conn.close()
    
    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row['gps_lon'], row['gps_lat']]},
            "properties": {
                "severity": row['dual_stream_verdict'],
                "ts": row['ts'],
                "turbidity_ntu": row['turbidity_ntu'],
                "ph_value": row['ph_value'],
                "dual_stream_verdict": row['dual_stream_verdict']
            }
        })
    return jsonify({"type": "FeatureCollection", "features": features})

@asaase_bp.route('/alerts', methods=['GET'])
def get_alerts():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400
        
    offset = (page - 1) * limit
    
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM asaase_alerts ORDER BY ts DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/reports/<int:alert_id>', methods=['GET'])
def get_report(alert_id):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM remediation_reports WHERE alert_id = ?", (alert_id,)).fetchone()
    conn.close()
    if row:
        return jsonify(dict(row))
    return jsonify({"error": "Report not found"}), 404

@asaase_bp.route('/status', methods=['GET'])
def get_status():
    conn = get_db_connection()
    # 24h stats
    cutoff = time.time() - 86400
    alert_count = conn.execute("SELECT COUNT(*) FROM asaase_alerts WHERE ts > ?", (cutoff,)).fetchone()[0]
    critical_count = conn.execute("SELECT COUNT(*) FROM asaase_alerts WHERE ts > ? AND severity = 'CRITICAL'", (cutoff,)).fetchone()[0]
    conn.close()
    
    status = {
        "ground": {
            "online": False,
            "battery_pct": 0,
            "last_seen": 0
        },
        "aqua": {
            "online": False,
            "battery_pct": 0,
            "last_seen": 0
        },
        "alert_count_24h": alert_count,
        "critical_count_24h": critical_count
    }
    
    # Check last seen for robots
    for rid, data in robot_last_seen.items():
        online = (time.time() - data['ts']) < 600 # 10 min window
        if rid.startswith('GROUND'):
            status['ground'] = {"online": online, "battery_pct": data['battery'], "last_seen": data['ts']}
        elif rid.startswith('AQUA'):
            status['aqua'] = {"online": online, "battery_pct": data['battery'], "last_seen": data['ts']}
            
    return jsonify(status)

@asaase_bp.route('/ground/waypoints', methods=['POST'])
def post_ground_waypoints():
    data = request.json
    robot_id = data.get('robot_id')
    waypoints = data.get('waypoints', [])
    
    if not validate_robot_id(robot_id) or not robot_id.startswith("GROUND"):
        return jsonify({"error": "Invalid Robot ID"}), 400
    
    api_logger.info(f"SET WAYPOINTS for {robot_id}: {len(waypoints)} points")
    save_waypoints(robot_id, waypoints)
    send_radio_command(robot_id, f"WAYPOINTS:{json.dumps(waypoints)}")
    return jsonify({"status": "success"})

@asaase_bp.route('/aqua/route', methods=['POST'])
def post_aqua_route():
    data = request.json
    robot_id = data.get('robot_id')
    waypoints = data.get('waypoints', [])
    
    if not validate_robot_id(robot_id) or not robot_id.startswith("AQUA"):
        return jsonify({"error": "Invalid Robot ID"}), 400
    
    api_logger.info(f"SET ROUTE for {robot_id}: {len(waypoints)} points")
    save_waypoints(robot_id, waypoints)
    send_radio_command(robot_id, f"ROUTE:{json.dumps(waypoints)}")
    return jsonify({"status": "success"})

@asaase_bp.route('/control/settings/<robot_id>', methods=['GET'])
def get_control_settings(robot_id):
    if not validate_robot_id(robot_id):
        return jsonify({"error": "Invalid Robot ID"}), 400
    return jsonify(get_robot_settings(robot_id))

@asaase_bp.route('/control/mode', methods=['POST'])
def post_control_mode():
    data = request.json
    robot_id = data.get('robot_id')
    mode = data.get('mode')
    
    if not validate_robot_id(robot_id):
        return jsonify({"error": "Invalid Robot ID"}), 400
        
    if mode not in ['MANUAL', 'SEMI_AUTO', 'FULLY_AUTO']:
        return jsonify({"error": "Invalid mode"}), 400
        
    api_logger.info(f"MODE CHANGE for {robot_id} -> {mode}")
    set_robot_mode(robot_id, mode)
    return jsonify({"status": "success", "mode": mode})

@asaase_bp.route('/control/manual', methods=['POST'])
def post_control_manual():
    data = request.json
    robot_id = data.get('robot_id')
    command = data.get('command')
    
    if not validate_robot_id(robot_id):
        return jsonify({"error": "Invalid Robot ID"}), 400
    
    settings = get_robot_settings(robot_id)
    if settings['control_mode'] == 'FULLY_AUTO':
        api_logger.warning(f"BLOCKED MANUAL COMMAND to {robot_id} (Robot in FULLY_AUTO)")
        return jsonify({"error": "Robot is in Fully Autonomous mode. Override not permitted."}), 403
        
    api_logger.info(f"MANUAL COMMAND for {robot_id}: {command}")
    set_robot_manual_command(robot_id, command)
    send_radio_command(robot_id, command)
    return jsonify({"status": "success", "command": command})

@asaase_bp.route('/base/settings', methods=['GET'])
def get_base_settings():
    from src.asaase.db import get_base_mode
    return jsonify({"operation_mode": get_base_mode()})

@asaase_bp.route('/base/mode', methods=['POST'])
def update_base_mode():
    data = request.json
    mode = data.get('mode')
    if mode not in ['MANUAL', 'SEMI_AUTO', 'FULLY_AUTO']:
        return jsonify({"error": "Invalid mode"}), 400
        
    api_logger.info(f"BASE MODE CHANGE -> {mode}")
    from src.asaase.db import set_base_mode
    set_base_mode(mode)
    return jsonify({"status": "success"})

@asaase_bp.route('/control/approvals', methods=['GET'])
def list_approvals():
    from src.asaase.db import get_pending_approvals
    return jsonify(get_pending_approvals())

@asaase_bp.route('/control/approve', methods=['POST'])
def approve_action():
    data = request.json
    approval_id = data.get('approval_id')
    action = data.get('action')
    
    if action not in ['APPROVED', 'REJECTED']:
        return jsonify({"error": "Invalid action"}), 400
        
    api_logger.info(f"APPROVAL for ID {approval_id}: {action}")
    from src.asaase.db import update_approval_status
    update_approval_status(approval_id, action)
    return jsonify({"status": "success"})

@asaase_bp.route('/health', methods=['GET'])
def get_system_health():
    try:
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        if hasattr(psutil, "sensors_temperatures"):
            temp_data = psutil.sensors_temperatures()
        else:
            temp_data = {}
            
        core_temp = 35
        if temp_data and 'coretemp' in temp_data:
            core_temp = temp_data['coretemp'][0].current
            
        return jsonify({
            "status": "OPERATIONAL",
            "cpu": cpu_usage,
            "ram": memory.percent,
            "disk": disk.percent,
            "temp": core_temp,
            "radio_latency_ms": 12 # Mocked value for serial handshake
        })
    except Exception as e:
        api_logger.error(f"HEALTH CHECK FAILED: {str(e)}")
        return jsonify({"status": "DEGRADED", "error": str(e)}), 500


