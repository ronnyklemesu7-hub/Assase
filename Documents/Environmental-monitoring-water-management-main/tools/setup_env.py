import os
import sqlite3

RUNS_DIR = "runs"
ENERGY_DB = os.path.join(RUNS_DIR, "energy.db")
DATA_DB = os.path.join(RUNS_DIR, "data.db")


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def init_energy_db(path: str):
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS turbine_samples (
        ts REAL NOT NULL,
        power_w REAL NOT NULL,
        rpm REAL NOT NULL
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS energy_daily (
        day TEXT PRIMARY KEY,
        energy_kwh REAL NOT NULL DEFAULT 0.0,
        avg_power_w REAL NOT NULL DEFAULT 0.0,
        samples INTEGER NOT NULL DEFAULT 0
    );
    """)
    conn.commit()
    conn.close()


def init_data_db(path: str):
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS env_frames (
        ts REAL NOT NULL,
        green_ratio REAL,
        baseline_green_ratio REAL,
        cover_change_pct REAL,
        tree_alert INTEGER,
        excavation_count INTEGER,
        activity_count INTEGER,
        payload TEXT
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS water_readings (
        ts REAL NOT NULL,
        ph REAL,
        turbidity_ntu REAL,
        temperature_c REAL,
        dissolved_oxygen_mgL REAL,
        alerts TEXT,
        recommendations TEXT
    );
    """)
    conn.commit()
    conn.close()


def main():
    ensure_dir(RUNS_DIR)
    init_energy_db(ENERGY_DB)
    init_data_db(DATA_DB)
    print(f"Initialized {RUNS_DIR}/ with energy.db and data.db")


if __name__ == "__main__":
    main()