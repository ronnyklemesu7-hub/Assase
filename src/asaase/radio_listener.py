import threading
import serial
import json
import os
import time
from pydantic import ValidationError
from src.asaase.models import GroundPacket, AquaPacket
from src.asaase.db import save_ground_telemetry, save_aqua_telemetry, create_alert
from src.asaase.sms import notify_all
from src.asaase.reports import generate_report
from src.asaase.logger import radio_logger

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

# Shared state for health monitoring and dispatch
robot_last_seen = {} # {robot_id: {"ts": float, "battery": int}}
command_queues = {"GROUND": [], "AQUA": []} # {prefix: [{"cmd": str, "retries": int, "ts": float}, ...]}
queue_lock = threading.Lock()

def load_config():
    try:
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        radio_logger.error(f"Failed to load config: {e}")
        return {}

def handle_ground_packet(packet_data: dict):
    try:
        packet = GroundPacket(**packet_data)
        data = packet.model_dump()
        data['ts'] = time.time()
        data['raw_packet'] = json.dumps(packet_data)
        
        save_ground_telemetry(data)
        robot_last_seen[packet.robot_id] = {"ts": data['ts'], "battery": packet.battery_pct}
        
        radio_logger.info(f"GROUND TELEMETRY: {packet.robot_id} (Batt: {packet.battery_pct}%, Soil: {packet.soil_classification})")
        
        if packet.soil_classification in ["MODERATE", "CRITICAL"]:
            alert_id = create_alert(
                packet.robot_id, 
                packet.soil_classification, 
                packet.gps_lat, 
                packet.gps_lon, 
                "SOIL", 
                f"Contamination detected: {packet.soil_classification}"
            )
            data['id'] = alert_id
            notify_all(data)
            if packet.soil_classification == "CRITICAL":
                generate_report(alert_id)
                radio_logger.warning(f"CRITICAL SOIL ALERT: {packet.robot_id} at {packet.gps_lat}, {packet.gps_lon}")
                
    except ValidationError as e:
        radio_logger.error(f"Ground Packet Validation Error: {e}")

def handle_aqua_packet(packet_data: dict, config: dict):
    try:
        packet = AquaPacket(**packet_data)
        data = packet.model_dump()
        data['ts'] = time.time()
        data['raw_packet'] = json.dumps(packet_data)
        
        # Dual-stream server-side re-validation
        verdict = packet.camera_water_classification
        if packet.camera_water_classification == "CRITICAL" and (
            packet.turbidity_ntu > config.get('turbidity_critical_ntu', 100) or 
            packet.ph_value < config.get('ph_critical_min', 6.0)
        ):
            verdict = "CRITICAL"
        
        data['dual_stream_verdict'] = verdict
        
        save_aqua_telemetry(data)
        robot_last_seen[packet.robot_id] = {"ts": data['ts'], "battery": packet.battery_pct}
        
        radio_logger.info(f"AQUA TELEMETRY: {packet.robot_id} (Batt: {packet.battery_pct}%, pH: {packet.ph_value}, Verdict: {verdict})")
        
        if verdict in ["MODERATE", "CRITICAL"]:
            alert_id = create_alert(
                packet.robot_id, 
                verdict, 
                packet.gps_lat, 
                packet.gps_lon, 
                "WATER", 
                f"Water contamination detected: {verdict}"
            )
            data['id'] = alert_id
            notify_all(data)
            if verdict == "CRITICAL":
                generate_report(alert_id)
                radio_logger.warning(f"CRITICAL WATER ALERT: {packet.robot_id} at {packet.gps_lat}, {packet.gps_lon}")
                
    except ValidationError as e:
        radio_logger.error(f"Aqua Packet Validation Error: {e}")

def listen_serial(port, baud_rate, robot_prefix):
    config = load_config()
    max_retries = 3
    
    while True:
        try:
            radio_logger.info(f"Attempting to open serial port {port} at {baud_rate} baud...")
            with serial.Serial(port, baud_rate, timeout=0.1) as ser:
                radio_logger.info(f"SERIAL CONNECTED: {port} for {robot_prefix}")
                while True:
                    # 1. Check for outgoing commands
                    with queue_lock:
                        if command_queues[robot_prefix]:
                            cmd_obj = command_queues[robot_prefix][0]
                            try:
                                ser.write(cmd_obj['cmd'].encode() + b'\n')
                                radio_logger.info(f"RADIO DISPATCH [{robot_prefix}] -> {cmd_obj['cmd']}")
                                command_queues[robot_prefix].pop(0)
                                time.sleep(0.1)
                            except Exception as write_err:
                                cmd_obj['retries'] += 1
                                radio_logger.error(f"Write failure on {port}: {write_err} (Retry {cmd_obj['retries']}/{max_retries})")
                                if cmd_obj['retries'] >= max_retries:
                                    radio_logger.critical(f"DROPPING COMMAND after {max_retries} failures: {cmd_obj['cmd']}")
                                    command_queues[robot_prefix].pop(0)
                                time.sleep(1)

                    # 2. Read incoming telemetry
                    try:
                        line = ser.readline().decode('utf-8', errors='ignore').strip()
                        if line:
                            packet_data = json.loads(line)
                            rid = packet_data.get("robot_id", "")
                            if rid.startswith(robot_prefix):
                                if robot_prefix == "GROUND":
                                    handle_ground_packet(packet_data)
                                elif robot_prefix == "AQUA":
                                    handle_aqua_packet(packet_data, config)
                            else:
                                radio_logger.debug(f"Ignoring packet from other robot prefix: {rid}")
                    except json.JSONDecodeError:
                        if line and line.startswith('{'):
                            radio_logger.error(f"Malformed JSON on {port}: {line}")
                    except Exception as read_err:
                        radio_logger.error(f"Error reading from {port}: {read_err}")
                        break # Exit inner loop to trigger port reopen

        except serial.SerialException as se:
            radio_logger.error(f"Serial port {port} unavailable: {se}. Retrying in 5s...")
            time.sleep(5)
        except Exception as e:
            radio_logger.error(f"Unexpected error in listener {port}: {e}. Restarting...")
            time.sleep(5)

def send_radio_command(robot_id: str, command: str):
    """Adds a command to the appropriate radio queue for dispatch."""
    prefix = "GROUND" if "GROUND" in robot_id else "AQUA"
    cmd_packet = json.dumps({"robot_id": robot_id, "command": command})
    
    with queue_lock:
        command_queues[prefix].append({
            "cmd": cmd_packet,
            "retries": 0,
            "ts": time.time()
        })
    radio_logger.info(f"COMMAND QUEUED for {robot_id}: {command}")

def start_radio_listener():
    config = load_config()
    if not config:
        radio_logger.error("No config found. Cannot start listeners.")
        return

    t1 = threading.Thread(target=listen_serial, args=(config.get('ground_serial_port', 'COM3'), config.get('baud_rate', 9600), "GROUND"), daemon=True)
    t2 = threading.Thread(target=listen_serial, args=(config.get('aqua_serial_port', 'COM4'), config.get('baud_rate', 9600), "AQUA"), daemon=True)
    t1.start()
    t2.start()
    radio_logger.info("ASAASE Radio Listeners started.")

