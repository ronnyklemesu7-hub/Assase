import argparse
import time
import requests
import json
import sys
from typing import Optional, Dict

from src.water.ingest import SerialWaterSource

def main():
    parser = argparse.ArgumentParser(description="Water Quality Hardware Ingest Runner")
    parser.add_argument("--serial-port", type=str, required=True, help="REQUIRED: Serial port for real sensor hardware (e.g., COM3, /dev/ttyUSB0)")
    parser.add_argument("--baudrate", type=int, default=9600, help="Baud rate for serial port")
    parser.add_argument("--period", type=float, default=1.0, help="Polling period in seconds")
    parser.add_argument("--api-url", type=str, default="http://localhost:5000/api/ingest/water", help="Backend API endpoint for ingestion")
    args = parser.parse_args()

    print(f"Starting hardware ingestion from {args.serial_port} at {args.baudrate} baud...")
    
    try:
        source = SerialWaterSource(port=args.serial_port, baudrate=args.baudrate, period_sec=args.period)
    except Exception as e:
        print(f"CRITICAL ERROR: Could not connect to hardware on {args.serial_port}.")
        print(f"Details: {e}")
        print("This is a production build. Mock simulated sources are disabled. Connect real hardware to proceed.")
        sys.exit(1)

    try:
        for reading in source.stream():
            payload = {
                "ph": reading.ph,
                "turbidity_ntu": reading.turbidity_ntu,
                "temperature_c": reading.temperature_c,
                "dissolved_oxygen_mgL": 8.0 # Standard approximation if not provided by sensor
            }
            try:
                # Post reading to real backend
                response = requests.post(args.api_url, json=payload, timeout=2)
                if response.status_code == 200:
                    print(f"[{time.strftime('%H:%M:%S')}] SENT TO BACKEND: pH={reading.ph:.2f} turbidity={reading.turbidity_ntu:.2f} NTU temp={reading.temperature_c:.1f}C")
                else:
                    print(f"Failed to ingest: Backend returned {response.status_code}")
            except Exception as e:
                print(f"Network error communicating with backend {args.api_url}: {e}")
    except KeyboardInterrupt:
        print("Stopping water monitoring hardware stream.")


if __name__ == "__main__":
    main()