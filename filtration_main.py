import argparse
import json
import os
import time

from src.environmental_monitoring.utils import JsonlLogger
from src.filtration.system import FiltrationSystem, FiltrationConfig


def main():
    parser = argparse.ArgumentParser(description="Filtration System Runner")
    parser.add_argument("--net-threshold", type=float, default=75.0, help="Net load percentage to trigger gear lift")
    parser.add_argument("--bottle-threshold", type=float, default=85.0, help="Bottle clog percentage to trigger backwash")
    parser.add_argument("--period", type=float, default=1.0, help="Control cycle period (seconds)")
    parser.add_argument("--duration", type=int, default=0, help="Total run duration seconds (0=until Ctrl+C)")
    parser.add_argument("--log", type=str, default="", help="Optional JSONL log file")
    args = parser.parse_args()

    cfg = FiltrationConfig(
        net_clear_threshold=args.net_threshold,
        bottle_clog_threshold=args.bottle_threshold,
        cycle_period_sec=args.period
    )

    system = FiltrationSystem(cfg=cfg)
    logger = JsonlLogger(args.log) if args.log else None
    
    latest_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    os.makedirs(os.path.dirname(latest_path), exist_ok=True)

    start = time.time()
    try:
        while True:
            status = system.step()
            print(f"[{time.strftime('%H:%M:%S')}] State={status['state']} | Nets={status['telemetry']['net_load_pct']}% "
                  f"Bottle={status['telemetry']['bottle_clog_pct']}% Flow={status['telemetry']['flow_lpm']}LPM")
            
            # Save latest status for energy system to read
            with open(latest_path, 'w') as f:
                json.dump(status, f)

            if logger:
                logger.write(status)
            
            time.sleep(cfg.cycle_period_sec)
            if args.duration > 0 and (time.time() - start) >= args.duration:
                break
    except KeyboardInterrupt:
        print("Stopping filtration system.")


if __name__ == "__main__":
    main()