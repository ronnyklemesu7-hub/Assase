import sqlite3
import time
from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class EnergyDBConfig:
    path: str = "runs/energy.db"


class EnergyDB:
    """
    Stores turbine readings and computes daily aggregates.
    Energy generated is integrated as power (W) * delta_t (s) -> Joules; kWh derived.
    """
    def __init__(self, cfg: EnergyDBConfig):
        self.cfg = cfg
        self._conn = sqlite3.connect(self.cfg.path)
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._ensure_schema()
        self._last_sample: Optional[Tuple[float, float]] = None  # (ts, power_w)

    def _ensure_schema(self):
        cur = self._conn.cursor()
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
        self._conn.commit()

    @staticmethod
    def _day_str(ts: float) -> str:
        return time.strftime("%Y-%m-%d", time.localtime(ts))

    def add_sample(self, ts: float, power_w: float, rpm: float):
        # insert raw
        self._conn.execute("INSERT INTO turbine_samples (ts, power_w, rpm) VALUES (?, ?, ?)", (ts, power_w, rpm))
        self._conn.commit()

        # integrate energy between samples
        if self._last_sample is not None:
            prev_ts, prev_p = self._last_sample
            dt = max(0.0, ts - prev_ts)
            # Energy in kWh: W * s / 3600000
            e_kwh = (prev_p * dt) / 3_600_000.0
            day = self._day_str(prev_ts)
            self._conn.execute("""
                INSERT INTO energy_daily (day, energy_kwh, avg_power_w, samples)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(day) DO UPDATE SET
                    energy_kwh = energy_kwh + excluded.energy_kwh,
                    avg_power_w = ((avg_power_w * samples) + ?) / (samples + 1),
                    samples = samples + 1
            """, (day, e_kwh, prev_p, 1, prev_p))
            self._conn.commit()

        self._last_sample = (ts, power_w)

    def get_day_stats(self, day: Optional[str] = None):
        if day is None:
            day = self._day_str(time.time())
        cur = self._conn.cursor()
        cur.execute("SELECT energy_kwh, avg_power_w, samples FROM energy_daily WHERE day = ?", (day,))
        row = cur.fetchone()
        if not row:
            return {"day": day, "energy_kwh": 0.0, "avg_power_w": 0.0, "samples": 0}
        return {"day": day, "energy_kwh": round(row[0], 4), "avg_power_w": round(row[1], 2), "samples": int(row[2])}

    def close(self):
        self._conn.close()