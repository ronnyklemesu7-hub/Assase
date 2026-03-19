import sqlite3
import os
import time
from src.asaase.logger import app_logger

DB_PATH = os.path.join(os.getcwd(), "runs", "data.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_asaase_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Ground Telemetry
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ground_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts REAL NOT NULL,
        robot_id TEXT NOT NULL,
        gps_lat REAL,
        gps_lon REAL,
        soil_classification TEXT,
        confidence_score REAL,
        dispenser_action TEXT,
        battery_pct INTEGER,
        patrol_waypoint_index INTEGER,
        raw_packet TEXT
    )
    """)
    
    # Aqua Telemetry
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS aqua_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts REAL NOT NULL,
        robot_id TEXT NOT NULL,
        gps_lat REAL,
        gps_lon REAL,
        turbidity_ntu REAL,
        ph_value REAL,
        camera_water_classification TEXT,
        dual_stream_verdict TEXT,
        neutralizer_dispensed_ml REAL,
        dye_marker_dropped INTEGER,
        battery_pct INTEGER,
        raw_packet TEXT
    )
    """)
    
    # ASAASE Alerts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS asaase_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts REAL NOT NULL,
        robot_id TEXT NOT NULL,
        severity TEXT NOT NULL,
        gps_lat REAL,
        gps_lon REAL,
        alert_type TEXT,
        sms_sent INTEGER DEFAULT 0,
        report_generated INTEGER DEFAULT 0,
        message TEXT
    )
    """)
    
    # Remediation Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS remediation_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id INTEGER REFERENCES asaase_alerts(id),
        generated_at REAL NOT NULL,
        report_en TEXT NOT NULL,
        report_tw TEXT,
        exported INTEGER DEFAULT 0
    )
    """)
    
    # Robot Waypoints
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS robot_waypoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        robot_id TEXT NOT NULL,
        waypoint_index INTEGER NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        active INTEGER DEFAULT 1
    )
    """)
    
    # Robot Settings (Control Modes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS robot_settings (
        robot_id TEXT PRIMARY KEY,
        control_mode TEXT NOT NULL DEFAULT 'FULLY_AUTO',
        last_command TEXT,
        last_command_ts REAL,
        pending_action TEXT,
        pending_action_ts REAL
    )
    """)
    
    # Base Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS base_settings (
        id INTEGER PRIMARY KEY,
        operation_mode TEXT NOT NULL DEFAULT 'FULLY_AUTO'
    )
    """)
    cursor.execute("INSERT OR IGNORE INTO base_settings (id, operation_mode) VALUES (1, 'FULLY_AUTO')")

    # Pending Approvals
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pending_approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        robot_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        severity TEXT,
        lat REAL,
        lon REAL,
        created_at REAL NOT NULL,
        status TEXT DEFAULT 'PENDING' -- PENDING, APPROVED, REJECTED, EXPIRED
    )
    """)


    
    conn.commit()
    conn.close()

def save_ground_telemetry(data: dict):
    conn = get_db_connection()
    conn.execute("""
    INSERT INTO ground_telemetry (
        ts, robot_id, gps_lat, gps_lon, soil_classification, 
        confidence_score, dispenser_action, battery_pct, 
        patrol_waypoint_index, raw_packet
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data['ts'], data['robot_id'], data['gps_lat'], data['gps_lon'],
        data['soil_classification'], data['confidence_score'],
        data['dispenser_action'], data['battery_pct'],
        data['patrol_waypoint_index'], data['raw_packet']
    ))
    conn.commit()
    conn.close()
    app_logger.debug(f"DB: Saved ground telemetry for {data['robot_id']}")

def save_aqua_telemetry(data: dict):
    conn = get_db_connection()
    conn.execute("""
    INSERT INTO aqua_telemetry (
        ts, robot_id, gps_lat, gps_lon, turbidity_ntu, ph_value,
        camera_water_classification, dual_stream_verdict,
        neutralizer_dispensed_ml, dye_marker_dropped, battery_pct, raw_packet
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data['ts'], data['robot_id'], data['gps_lat'], data['gps_lon'],
        data['turbidity_ntu'], data['ph_value'],
        data['camera_water_classification'], data['dual_stream_verdict'],
        data['neutralizer_dispensed_ml'], 1 if data['dye_marker_dropped'] else 0,
        data['battery_pct'], data['raw_packet']
    ))
    conn.commit()
    conn.close()
    app_logger.debug(f"DB: Saved aqua telemetry for {data['robot_id']}")

def create_alert(robot_id, severity, lat, lon, alert_type, message):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO asaase_alerts (ts, robot_id, severity, gps_lat, gps_lon, alert_type, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (time.time(), robot_id, severity, lat, lon, alert_type, message))
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id

def update_alert_sms_status(alert_id, status):
    conn = get_db_connection()
    conn.execute("UPDATE asaase_alerts SET sms_sent = ? WHERE id = ?", (1 if status else 0, alert_id))
    conn.commit()
    conn.close()

def update_alert_report_status(alert_id, status):
    conn = get_db_connection()
    conn.execute("UPDATE asaase_alerts SET report_generated = ? WHERE id = ?", (1 if status else 0, alert_id))
    conn.commit()
    conn.close()

def save_remediation_report(alert_id, report_en, report_tw):
    conn = get_db_connection()
    conn.execute("""
    INSERT INTO remediation_reports (alert_id, generated_at, report_en, report_tw)
    VALUES (?, ?, ?, ?)
    """, (alert_id, time.time(), report_en, report_tw))
    conn.commit()
    conn.close()

def save_waypoints(robot_id, waypoints):
    conn = get_db_connection()
    conn.execute("DELETE FROM robot_waypoints WHERE robot_id = ?", (robot_id,))
    for idx, wp in enumerate(waypoints):
        conn.execute("""
        INSERT INTO robot_waypoints (robot_id, waypoint_index, lat, lon)
        VALUES (?, ?, ?, ?)
        """, (robot_id, idx, wp['lat'], wp['lon']))
    conn.commit()
    conn.close()

def get_robot_settings(robot_id):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM robot_settings WHERE robot_id = ?", (robot_id,)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"robot_id": robot_id, "control_mode": "FULLY_AUTO", "last_command": None, "last_command_ts": 0}

def set_robot_mode(robot_id, mode):
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO robot_settings (robot_id, control_mode) 
        VALUES (?, ?)
        ON CONFLICT(robot_id) DO UPDATE SET control_mode = excluded.control_mode
    """, (robot_id, mode))
    conn.commit()
    conn.close()

def set_robot_manual_command(robot_id, command):
    conn = get_db_connection()
    conn.execute("""
        UPDATE robot_settings 
        SET last_command = ?, last_command_ts = ? 
        WHERE robot_id = ?
    """, (command, time.time(), robot_id))
    conn.commit()
    conn.close()

def get_base_mode():
    conn = get_db_connection()
    row = conn.execute("SELECT operation_mode FROM base_settings WHERE id = 1").fetchone()
    conn.close()
    return row['operation_mode'] if row else 'FULLY_AUTO'

def set_base_mode(mode):
    conn = get_db_connection()
    conn.execute("UPDATE base_settings SET operation_mode = ? WHERE id = 1", (mode,))
    conn.commit()
    conn.close()

def create_pending_approval(robot_id, action_type, severity, lat, lon):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO pending_approvals (robot_id, action_type, severity, lat, lon, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (robot_id, action_type, severity, lat, lon, time.time()))
    id = cursor.lastrowid
    conn.commit()
    conn.close()
    return id

def get_pending_approvals():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM pending_approvals WHERE status = 'PENDING' ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_approval_status(approval_id, status):
    conn = get_db_connection()
    conn.execute("UPDATE pending_approvals SET status = ? WHERE id = ?", (status, approval_id))
    conn.commit()
    conn.close()
    app_logger.info(f"DB: Updated approval {approval_id} to {status}")


