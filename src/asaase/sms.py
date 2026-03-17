import serial
import time
import os
import json
from datetime import datetime

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

alert_history = [] # For deduplication: list of (robot_id, lat, lon, ts)

def send_sms(phone: str, message: str) -> bool:
    config = load_config()
    retry_count = 0
    max_retries = 3
    
    while retry_count < max_retries:
        try:
            ser = serial.Serial(config['sms_port'], 9600, timeout=5)
            ser.write(b'AT\r')
            time.sleep(1)
            ser.write(b'AT+CMGF=1\r')
            time.sleep(1)
            ser.write(f'AT+CMGS="{phone}"\r'.encode())
            time.sleep(1)
            ser.write(message.encode() + b"\x1A")
            time.sleep(3)
            ser.close()
            return True
        except Exception as e:
            print(f"SMS Send Error (Attempt {retry_count+1}): {e}")
            retry_count += 1
            if retry_count < max_retries:
                time.sleep(30)
    return False

def notify_all(alert: dict):
    config = load_config()
    
    # Deduplication
    now = time.time()
    global alert_history
    # Clean old alerts from history
    alert_history = [h for h in alert_history if now - h[3] < config['sms_dedup_window_min'] * 60]
    
    # Check if similar alert exists (within 0.001 degree radius)
    for h in alert_history:
        if h[0] == alert['robot_id']:
            dist = ((h[1] - alert['gps_lat'])**2 + (h[2] - alert['gps_lon'])**2)**0.5
            if dist < 0.001:
                print(f"SMS Deduplicated: Similar alert for {alert['robot_id']} sent recently.")
                return

    timestamp = datetime.fromtimestamp(alert['ts']).strftime('%Y-%m-%d %H:%M:%S')
    message = f"ASAASE [{alert['robot_id']}] {alert['severity']} at {alert['gps_lat']:.4f},{alert['gps_lon']:.4f} on {timestamp}. Action: {alert.get('dispenser_action', alert.get('dual_stream_verdict', 'ALERTED'))}. http://192.168.1.1:3000"
    
    success = True
    for phone in config['sms_recipients']:
        if not send_sms(phone, message):
            success = False
    
    if success:
        alert_history.append((alert['robot_id'], alert['gps_lat'], alert['gps_lon'], now))
        from src.asaase.db import update_alert_sms_status
        update_alert_sms_status(alert['id'], True)
    else:
        print(f"Failed to send SMS for alert {alert['id']}")
