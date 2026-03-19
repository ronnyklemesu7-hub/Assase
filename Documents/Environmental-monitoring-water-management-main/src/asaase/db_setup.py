import os
import sqlite3
import time
import sys

def setup_database():
    print("ASAASE-DB: Initializing Database Auto-Setup...")
    db_path = 'data/asaase.db'
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Schema definitions
    tables = {
        "ground_telemetry": """
            CREATE TABLE IF NOT EXISTS ground_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts REAL NOT NULL,
                gps_lat REAL,
                gps_lon REAL,
                battery_pct INTEGER,
                soil_classification TEXT,
                confidence_score REAL,
                dispenser_action TEXT,
                raw_payload TEXT
            )
        """,
        "aqua_telemetry": """
            CREATE TABLE IF NOT EXISTS aqua_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts REAL NOT NULL,
                gps_lat REAL,
                gps_lon REAL,
                battery_pct INTEGER,
                turbidity_ntu REAL,
                ph_value REAL,
                dual_stream_verdict TEXT,
                raw_payload TEXT
            )
        """,
        "waypoints": """
            CREATE TABLE IF NOT EXISTS waypoints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                robot_id TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                seq INTEGER NOT NULL
            )
        """,
        "system_settings": """
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """,
        "pending_approvals": """
            CREATE TABLE IF NOT EXISTS pending_approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts REAL NOT NULL,
                robot_id TEXT,
                action_type TEXT,
                details TEXT,
                status TEXT DEFAULT 'PENDING'
            )
        """,
        "alerts": """
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts REAL NOT NULL,
                severity TEXT,
                robot_id TEXT,
                message TEXT,
                remediation_id INTEGER
            )
        """
    }
    
    for name, sql in tables.items():
        print(f"ASAASE-DB: Checking table '{name}'...")
        cursor.execute(sql)
    
    # Initialize default settings
    default_settings = [
        ('base_mode', 'MANUAL'),
        ('ground_control_mode', 'MANUAL'),
        ('aqua_control_mode', 'MANUAL')
    ]
    
    for key, val in default_settings:
        cursor.execute("INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)", (key, val))
    
    conn.commit()
    conn.close()
    print("ASAASE-DB: Setup Complete. System Ready.")

if __name__ == "__main__":
    setup_database()
