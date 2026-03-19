import os
import json
import time
from datetime import datetime
from src.asaase.db import get_db_connection, save_remediation_report, update_alert_report_status

def generate_report(alert_id: int):
    conn = get_db_connection()
    alert = conn.execute("SELECT * FROM asaase_alerts WHERE id = ?", (alert_id,)).fetchone()
    if not alert:
        conn.close()
        return None
    
    alert = dict(alert)
    telemetry = None
    if alert['robot_id'].startswith('GROUND'):
        telemetry = conn.execute("SELECT * FROM ground_telemetry WHERE robot_id = ? ORDER BY ts DESC LIMIT 1", (alert['robot_id'],)).fetchone()
    else:
        telemetry = conn.execute("SELECT * FROM aqua_telemetry WHERE robot_id = ? ORDER BY ts DESC LIMIT 1", (alert['robot_id'],)).fetchone()
    
    conn.close()
    if telemetry:
        telemetry = dict(telemetry)
    
    timestamp = datetime.fromtimestamp(alert['ts']).strftime('%Y-%m-%d %H:%M:%S')
    
    # English Content (Strict Identity Spec)
    report_en = {
        "incident_summary": {
            "robot": alert['robot_id'],
            "location": f"{alert['gps_lat']:.4f}, {alert['gps_lon']:.4f}",
            "timestamp": timestamp,
            "severity": alert['severity'],
            "sensor_readings": telemetry if telemetry else "Historical telemetry unavailable"
        },
        "detected_contaminants": "Mercury/Lead/Arsenic (Soil)" if alert['alert_type'] == 'SOIL' else "High acidity/chemical contamination (Water)",
        "robot_actions_taken": "Biochar (50g/m²) + Vetiver/Chromolaena seeds deployed." if alert['severity'] == 'CRITICAL' else "Initial monitoring/seeding.",
        "recommended_followup": "Immediate EPA field inspection required. Secure site and prevent further access.",
        "phytoremediation_prescription": "Vetiver grass (Chrysopogon zizanioides) for soil binding, Chromolaena odorata for rapid remediation, Mucuna pruriens for nitrogen fixation.",
        "treatment_protocol": "Biochar dose (50g/m²) mixed into top 5cm. pH neutralization via Slaked Lime (Ca(OH)₂) for water sites."
    }
    
    # Twi Content (Strict Identity Spec - Bilingual requirement)
    report_tw = {
        "incident_header_tw": f"ASAASE Amanneɛbɔ - {alert['severity']}",
        "location_tw": f"Beaeɛ: {alert['gps_lat']:.4f}, {alert['gps_lon']:.4f}",
        "detected_contaminants_tw": "Mframa bɔne ne dɔteɛ a asɛe" if alert['alert_type'] == 'SOIL' else "Nsuo a asɛe ne nneɛma bɔne a ɛwom",
        "robot_actions_taken_tw": "Yɛagu biochar aduro ne Vetiver/Acheampong nhwiren aba.",
        "recommended_followup_tw": "EPA mpaninfoɛ nkyɛn kɔhwehwɛ mu ntɛm pa ara. Monsi kwan mma nkorɔfoɔ mmɛnom nsuo no.",
        "phytoremediation_presc_tw": "Vetiver grass (Chrysopogon zizanioides), Acheampong nhwiren (Chromolaena odorata) - Monnua no mita 10 mu biara.",
        "treatment_protocol_tw": "Biochar (50g/m²). Momfra dɔteɛ no mu ansa na moatue aba foforɔ no. Slaked Lime (Mhyire) na yɛde siesie nsuo no.",
        "safety_message_tw": "Nsuo yi nkoa nka hwɛ (Do not touch/drink this water)."
    }
    
    save_remediation_report(alert_id, json.dumps(report_en), json.dumps(report_tw))
    update_alert_report_status(alert_id, True)
    
    return {"en": report_en, "tw": report_tw}
