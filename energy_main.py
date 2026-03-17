import argparse
import time
import requests
import json
import sys

from src.energy.ingest import SerialTurbineSource

def main():
    parser = argparse.ArgumentParser(description="Energy Generation Hardware Ingest Runner")
    parser.add_argument("--serial-port", type=str, required=True, help="REQUIRED: Serial port for real turbine hardware (e.g., COM4, /dev/ttyUSB1)")
    parser.add_argument("--baudrate", type=int, default=9600, help="Baud rate for serial port")
    parser.add_argument("--period", type=float, default=1.0, help="Telemetry sampling period (seconds)")
    parser.add_argument("--api-url", type=str, default="http://localhost:5000/api/ingest/energy", help="Backend API endpoint for ingestion")
    args = parser.parse_args()

    print(f"Starting energy ingestion from {args.serial_port} at {args.baudrate} baud...")

    try:
        source = SerialTurbineSource(port=args.serial_port, baudrate=args.baudrate, period_sec=args.period)
    except Exception as e:
        print(f"CRITICAL ERROR: Could not connect to hardware on {args.serial_port}.")
        print(f"Details: {e}")
        print("This is a production build. Mock simulated sources are disabled. Connect real hardware to proceed.")
        sys.exit(1)

    try:
        for reading in source.stream():
            payload = {
                "ts": reading.ts,
                "power_w": reading.power_w,
                "rpm": reading.rpm
            }
            try:
                response = requests.post(args.api_url, json=payload, timeout=2)
                if response.status_code == 200:
                    print(f"[{time.strftime('%H:%M:%S')}] SENT TO BACKEND: power={reading.power_w:.1f}W rpm={reading.rpm:.0f}")
                else:
                    print(f"Failed to ingest: Backend returned {response.status_code}")
            except Exception as e:
                print(f"Network error communicating with backend {args.api_url}: {e}")
    except KeyboardInterrupt:
        print("Stopping energy monitoring.")

if __name__ == "__main__":
    main()