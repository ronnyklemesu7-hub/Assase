import threading
import time
import os
import json
from src.asaase.radio_listener import robot_last_seen
from src.asaase.db import create_alert
from src.asaase.sms import notify_all

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def monitor_health():
    config = load_config()
    offline_alerts = {} # {robot_id: last_alert_ts}
    
    while True:
        now = time.time()
        for robot_id, last_seen in robot_last_seen.items():
            timeout_sec = config['robot_offline_timeout_min'] * 60
            if now - last_seen['ts'] > timeout_sec:
                # Check if we already alerted in the last 30 mins
                last_alert = offline_alerts.get(robot_id, 0)
                if now - last_alert > 1800:
                    alert_id = create_alert(
                        robot_id, 
                        "CRITICAL", 
                        0.0, 0.0, # Unknown location
                        "ROBOT_OFFLINE", 
                        f"Robot OFFLINE: No signal for {config['robot_offline_timeout_min']}+ minutes."
                    )
                    
                    alert_data = {
                        "id": alert_id,
                        "robot_id": robot_id,
                        "severity": "CRITICAL",
                        "gps_lat": 0.0,
                        "gps_lon": 0.0,
                        "ts": now,
                        "alert_type": "ROBOT_OFFLINE"
                    }
                    notify_all(alert_data)
                    offline_alerts[robot_id] = now
                    print(f"ASAASE Health Monitor: Alerted for offline robot {robot_id}")
                    
        time.sleep(60)

def start_health_monitor():
    t = threading.Thread(target=monitor_health, daemon=True)
    t.start()
