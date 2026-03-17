import os
import sqlite3

ENERGY_DB = "runs/energy.db"
DATA_DB = "runs/data.db"
FILES = [
    "runs/monitor_log.jsonl",
    "runs/water_log.jsonl",
]


def check_db(path: str, tables: list[str]) -> dict:
    if not os.path.exists(path):
        return {"exists": False, "tables": {}}
    out = {"exists": True, "tables": {}}
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        for t in tables:
            try:
                cur.execute(f"SELECT COUNT(1) FROM {t}")
                cnt = cur.fetchone()[0]
                out["tables"][t] = {"exists": True, "rows": int(cnt)}
            except sqlite3.Error:
                out["tables"][t] = {"exists": False, "rows": 0}
        conn.close()
    except Exception as e:
        out["error"] = str(e)
    return out


def main():
    print("Verifying setup...")
    energy = check_db(ENERGY_DB, ["turbine_samples", "energy_daily"])
    data = check_db(DATA_DB, ["env_frames", "water_readings", "distribution_events", "distribution_daily", "alerts"])
    print(f"Energy DB: {energy}")
    print(f"Data DB: {data}")

    for f in FILES:
        print(f"File {f}: {'present' if os.path.exists(f) else 'missing'}")


if __name__ == "__main__":
    main()