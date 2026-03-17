import os
import sys
import time
import serial.tools.list_ports
import requests

def check_env():
    print("[1/4] Checking Environment...")
    if not os.path.exists('data'):
        print("  - ERROR: 'data' directory missing!")
        return False
    print("  - OK: Environment looks good.")
    return True

def check_hardware():
    print("[2/4] Checking Hardware Interface...")
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        print("  - WARNING: No Serial/USB devices found. Radio might be disconnected.")
    else:
        print(f"  - OK: Found {len(ports)} serial ports.")
    return True

def check_backend():
    print("[3/4] Testing Backend API...")
    try:
        r = requests.get('http://localhost:5000/api/asaase/status', timeout=2)
        if r.status_code == 200:
            print("  - OK: Backend API responding.")
        else:
            print(f"  - WARNING: Backend returned status {r.status_code}.")
    except:
        print("  - ERROR: Backend API not reachable! Start the server first.")
        return False
    return True

def check_db():
    print("[4/4] Checking Database Health...")
    import sqlite3
    try:
        conn = sqlite3.connect('data/asaase.db')
        c = conn.cursor()
        c.execute("SELECT count(*) FROM system_settings")
        print(f"  - OK: Database connected and responding.")
        conn.close()
    except:
        print("  - ERROR: Database corrupt or not initialized!")
        return False
    return True

def run_preflight():
    print("="*40)
    print("ASAASE TACTICAL HUB - PRE-FLIGHT CHECK")
    print("="*40)
    
    checks = [check_env, check_hardware, check_backend, check_db]
    all_ok = True
    
    for check in checks:
        if not check():
            all_ok = False
            
    print("-" * 40)
    if all_ok:
        print("RESULT: SYSTEM READY FOR MISSION")
    else:
        print("RESULT: MISSION CRITICAL ERRORS DETECTED")
    print("="*40)

if __name__ == "__main__":
    run_preflight()
