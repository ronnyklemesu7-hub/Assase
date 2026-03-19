import argparse
import time
from pathlib import Path
import subprocess
import sys

from src.energy.storage import EnergyDB, EnergyDBConfig


def summarize_energy(db_path: str):
    db = EnergyDB(EnergyDBConfig(path=db_path))
    stats = db.get_day_stats()
    db.close()
    print(f"[Energy] {stats['day']}: {stats['energy_kwh']:.4f} kWh, avg {stats['avg_power_w']:.1f} W, samples={stats['samples']}")


def export_csv(data_db: str, out_dir: str) -> int:
    cmd = [sys.executable, "tools/export_csv.py", "--db", data_db, "--out", out_dir]
    print(f"Running: {' '.join(cmd)}")
    res = subprocess.run(cmd, check=False)
    return res.returncode


def main():
    parser = argparse.ArgumentParser(description="Lightweight scheduler for periodic rollups and exports")
    parser.add_argument("--energy-db", type=str, default="runs/energy.db")
    parser.add_argument("--data-db", type=str, default="runs/data.db")
    parser.add_argument("--export-out", type=str, default="runs/exports")
    parser.add_argument("--interval-min", type=int, default=60, help="Run tasks every N minutes")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    args = parser.parse_args()

    try:
        while True:
            print(f"=== Scheduler tick ===")
            summarize_energy(args.energy_db)
            rc = export_csv(args.data_db, args.export_out)
            if args.once:
                if rc and rc != 0:
                    raise SystemExit(rc)
                break
            time.sleep(max(1, args.interval_min) * 60)
    except KeyboardInterrupt:
        print("Scheduler stopped.")


if __name__ == "__main__":
    main()