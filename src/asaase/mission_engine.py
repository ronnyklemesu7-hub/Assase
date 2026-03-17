import threading
import time
import math
import random
import json
from src.asaase.db import (
    get_db_connection, save_ground_telemetry, save_aqua_telemetry, 
    get_robot_settings, set_robot_manual_command, create_alert, 
    save_remediation_report, get_pending_approvals, update_approval_status,
    create_pending_approval, get_base_mode
)

class MissionEngine:
    def __init__(self):
        self.robots = ["GROUND_01", "AQUA_01"]
        self.threads = {}
        self.running = False
        self.robot_states = {
            "GROUND_01": {"halted_until": 0, "current_approval_id": None, "pos": {"lat": 6.5, "lon": -1.5}},
            "AQUA_01": {"halted_until": 0, "current_approval_id": None, "pos": {"lat": 6.5, "lon": -1.6}}
        }

    def start(self):
        self.running = True
        for rid in self.robots:
            t = threading.Thread(target=self._robot_loop, args=(rid,), daemon=True)
            self.threads[rid] = t
            t.start()
        print("ASAASE Production Mission Engine Started.")

    def _robot_loop(self, robot_id):
        is_ground = "GROUND" in robot_id
        wp_idx = 0
        battery = 100
        
        while self.running:
            try:
                now = time.time()
                settings = get_robot_settings(robot_id)
                mode = settings['control_mode']
                last_cmd = settings['last_command']
                last_cmd_ts = settings['last_command_ts'] or 0
                cmd_fresh = (now - last_cmd_ts) < 2.0
                
                state = self.robot_states[robot_id]
                pos = state['pos']
                
                moved = False
                action_taken = None
                telemetry_data = {
                    "ts": now,
                    "robot_id": robot_id,
                    "gps_lat": pos['lat'],
                    "gps_lon": pos['lon'],
                    "battery_pct": int(battery),
                    "raw_packet": json.dumps({"simulated": True})
                }

                # 1. MANUAL MODE: Pure relay. No interpretive labels. No OA.
                if mode == 'MANUAL':
                    if cmd_fresh and last_cmd:
                        pos, moved = self._apply_movement(pos, last_cmd, 0.0001)
                        if not moved: action_taken = last_cmd
                    
                    # Log raw sensors
                    if is_ground:
                        telemetry_data.update({
                            "soil_classification": "RAW_SENSOR",
                            "confidence_score": 0.0,
                            "dispenser_action": "NONE",
                            "patrol_waypoint_index": -1
                        })
                        save_ground_telemetry(telemetry_data)
                    else:
                        telemetry_data.update({
                            "turbidity_ntu": 15.0, # Raw
                            "ph_value": 7.0, # Raw
                            "camera_water_classification": "RAW_STREAM",
                            "dual_stream_verdict": "RAW",
                            "neutralizer_dispensed_ml": 0.0,
                            "dye_marker_dropped": False
                        })
                        save_aqua_telemetry(telemetry_data)

                # 2. SEMI-MANUAL: Scout with 5m/3m permission halt. OA active.
                elif mode == 'SEMI_AUTO': # Mapping SEMI-MANUAL to SEMI_AUTO in DB
                    timeout = 300 if is_ground else 180 # 5m vs 3m
                    
                    # SEMI-MANUAL overrides: Check for fresh manual movement
                    if cmd_fresh and last_cmd in ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'STOP']:
                        pos, moved = self._apply_movement(pos, last_cmd, 0.0001)
                    
                    # Check if we were halted and wait for approval
                    if state['halted_until'] > now or state['halted_until'] == -1:
                        # Existing halt logic remains
                        conn = get_db_connection()
                        approval = conn.execute("SELECT status, severity FROM pending_approvals WHERE id = ?", (state['current_approval_id'],)).fetchone()
                        conn.close()
                        
                        if approval and approval['status'] == 'APPROVED':
                            # Execute payload!
                            action_taken = "DISPENSE_REMEDIATION"
                            state['halted_until'] = 0 # Resume
                        elif approval and approval['status'] == 'REJECTED':
                            state['halted_until'] = 0 # Skip
                        else:
                            # Still waiting. 
                            # If MODERATE and timeout reached, resume patrol per Identity.
                            if approval and approval['severity'] == 'MODERATE' and state['halted_until'] > 0 and state['halted_until'] <= now:
                                state['halted_until'] = 0
                    
                    if state['halted_until'] == 0 and not moved:
                        # Normal patrol only if not manually moving
                        waypoints = self._get_waypoints(robot_id)
                        if waypoints:
                            target = waypoints[wp_idx % len(waypoints)]
                            pos, reached = self._move_towards(pos, target, 0.0001)
                            moved = True
                            if reached: wp_idx += 1
                        
                        if random.random() < 0.02: # Periodic detection
                            severity = "CRITICAL" if random.random() < 0.3 else "MODERATE"
                            # Semi-manual Identity: Moderate = 5m timeout, Critical = Indefinite
                            if severity == "CRITICAL":
                                state['halted_until'] = -1 # Infinite
                            else:
                                state['halted_until'] = now + timeout
                            
                            state['current_approval_id'] = create_pending_approval(
                                robot_id, "REMEDIATION", severity, pos['lat'], pos['lon']
                            )
                            # Notify via Base mode
                            base_mode = get_base_mode()
                            print(f"BASE [{base_mode}]: Drafted {severity} alert for {robot_id} - Awaiting Operator.")

                    # Log telemetery for Semi-Manual
                    if is_ground:
                        telemetry_data.update({
                            "soil_classification": "SCANNING" if state['halted_until'] > now else "CLEAN",
                            "confidence_score": 0.88,
                            "dispenser_action": "SEEDS_ONLY" if action_taken else "NONE",
                            "patrol_waypoint_index": wp_idx
                        })
                        save_ground_telemetry(telemetry_data)
                    else:
                        telemetry_data.update({
                            "turbidity_ntu": 45.0,
                            "ph_value": 4.2,
                            "camera_water_classification": "SAFE",
                            "dual_stream_verdict": "CRITICAL" if state['halted_until'] > now else "CLEAN",
                            "neutralizer_dispensed_ml": 100.0 if action_taken else 0.0,
                            "dye_marker_dropped": False
                        })
                        save_aqua_telemetry(telemetry_data)

                # 3. FULLY AUTONOMOUS: Instant action. RTB check. alert <60s.
                elif mode == 'FULLY_AUTO':
                    # RTB Check (Strict Identity: 20% for Ground, 15% for Aqua)
                    rtb_threshold = 20 if is_ground else 15
                    if battery <= rtb_threshold:
                        # Return to base coordinates (6.5, -1.5 for G, 6.5, -1.6 for A)
                        target = {"lat": 6.5, "lon": -1.5} if is_ground else {"lat": 6.5, "lon": -1.6}
                        pos, reached = self._move_towards(pos, target, 0.0002) # Faster RTB
                        moved = True
                        if reached:
                             battery = 100 # Reset sim once arrived
                             print(f"ASAASE [{robot_id}] -> Reached RTB point. Recharging.")
                    else:
                        # Normal patrol
                        waypoints = self._get_waypoints(robot_id)
                        if waypoints:
                            target = waypoints[wp_idx % len(waypoints)]
                            pos, reached = self._move_towards(pos, target, 0.0001)
                            moved = True
                            if reached: wp_idx += 1
                        
                        # Autonomous detection
                        if random.random() < 0.03:
                            action_taken = "AUTO_RESTORATION"
                            self._trigger_fully_auto_logic(robot_id, pos)

                    # Log telemetry
                    if is_ground:
                        telemetry_data.update({
                            "soil_classification": "CRITICAL" if action_taken else "CLEAN",
                            "confidence_score": 0.98,
                            "dispenser_action": "BIOCHAR_AND_SEEDS" if action_taken else "NONE",
                            "patrol_waypoint_index": wp_idx
                        })
                        save_ground_telemetry(telemetry_data)
                    else:
                        telemetry_data.update({
                            "turbidity_ntu": 80.0,
                            "ph_value": 3.5,
                            "camera_water_classification": "CRITICAL",
                            "dual_stream_verdict": "CRITICAL",
                            "neutralizer_dispensed_ml": 250.0 if action_taken else 0.0,
                            "dye_marker_dropped": action_taken is not None
                        })
                        save_aqua_telemetry(telemetry_data)

                # Final update
                state['pos'] = pos
                battery -= 0.01 if moved else 0.002
                
                # Clear atomic commands
                if cmd_fresh and last_cmd and last_cmd not in ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT']:
                    set_robot_manual_command(robot_id, None)

            except Exception as e:
                print(f"Mission Engine Error [{robot_id}]: {e}")
            
            time.sleep(1.0)

    def _apply_movement(self, pos, cmd, delta):
        new_pos = pos.copy()
        moved = False
        if cmd == 'FORWARD': new_pos['lat'] += delta; moved = True
        elif cmd == 'BACKWARD': new_pos['lat'] -= delta; moved = True
        elif cmd == 'LEFT': new_pos['lon'] -= delta; moved = True
        elif cmd == 'RIGHT': new_pos['lon'] += delta; moved = True
        return new_pos, moved

    def _move_towards(self, current, target, delta):
        dy = target['lat'] - current['lat']
        dx = target['lon'] - current['lon']
        dist = math.sqrt(dx*dx + dy*dy)
        if dist < delta: return target, True
        angle = math.atan2(dy, dx)
        return {
            "lat": current['lat'] + math.sin(angle) * delta,
            "lon": current['lon'] + math.cos(angle) * delta
        }, False

    def _get_waypoints(self, robot_id):
        conn = get_db_connection()
        rows = conn.execute("SELECT lat, lon FROM robot_waypoints WHERE robot_id = ? ORDER BY waypoint_index ASC", (robot_id,)).fetchall()
        conn.close()
        return [{"lat": r['lat'], "lon": r['lon']} for r in rows]

    def _trigger_fully_auto_logic(self, robot_id, pos):
        is_ground = "GROUND" in robot_id
        severity = "CRITICAL"
        alert_type = "SOIL" if is_ground else "WATER"
        
        # 1. Immediate Alert
        alert_id = create_alert(robot_id, severity, pos['lat'], pos['lon'], alert_type, "[AUTO] CRITICAL - Immediate Remediation Started.")
        
        # 2. Trigger Base logic (Bilingual report + SMS)
        base_mode = get_base_mode()
        print(f"BASE [{base_mode}]: Triggering <60s SMS and Remediation Report for {robot_id}")
        
        report_en = f"DETECTION: {alert_type} CRITICAL\nStatus: Autonomous Restoration Deployed."
        report_tw = f"NHWƐSƐ: {alert_type} CRITICAL\nTebea: Yɛasiesie mmeae no."
        from src.asaase.db import save_remediation_report
        save_remediation_report(alert_id, report_en, report_tw)

_engine = MissionEngine()
def start_mission_engine():
    _engine.start()
