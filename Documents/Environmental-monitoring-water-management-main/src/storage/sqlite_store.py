import json
import sqlite3
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, List


@dataclass
class StoreConfig:
    path: str = "runs/data.db"


class SQLiteStore:
    def __init__(self, cfg: StoreConfig):
        self.cfg = cfg
        self._conn = sqlite3.connect(self.cfg.path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._ensure_schema()

    def _ensure_schema(self):
        cur = self._conn.cursor()
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
        cur.execute("""
        CREATE TABLE IF NOT EXISTS distribution_events (
            ts REAL NOT NULL,
            home TEXT NOT NULL,
            path TEXT NOT NULL,
            cost REAL NOT NULL,
            volume_liters REAL NOT NULL
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS distribution_daily (
            day TEXT PRIMARY KEY,
            total_volume_liters REAL NOT NULL DEFAULT 0.0
        );
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );
        """)
        
        # Insert default admin user if not exists
        # Username: admin, Password: password
        import bcrypt
        default_pw = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode('utf-8')
        cur.execute("INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)", ("admin", default_pw))

        self._conn.commit()

    @staticmethod
    def _day_str(ts: float) -> str:
        return time.strftime("%Y-%m-%d", time.localtime(ts))

    def insert_env(self, payload: Dict[str, Any]) -> None:
        ts = time.time()
        tree = payload.get("tree", {})
        excavation = payload.get("excavation", {})
        activity = payload.get("activity", {})
        alerts = payload.get("alerts", {})
        self._conn.execute(
            "INSERT INTO env_frames (ts, green_ratio, baseline_green_ratio, cover_change_pct, tree_alert, excavation_count, activity_count, payload)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                ts,
                tree.get("green_ratio"),
                tree.get("baseline_green_ratio"),
                tree.get("cover_change_pct"),
                1 if alerts.get("tree_cover") else 0,
                int(excavation.get("count", 0)),
                int(activity.get("count", 0)),
                json.dumps(payload),
            ),
        )
        self._conn.commit()

    def insert_water(self, result: Dict[str, Any]) -> None:
        r = result.get("reading", {})
        alerts = result.get("alerts", {})
        recs = result.get("recommendations", {})
        self._conn.execute(
            "INSERT INTO water_readings (ts, ph, turbidity_ntu, temperature_c, dissolved_oxygen_mgL, alerts, recommendations)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                r.get("ts", time.time()),
                r.get("ph"),
                r.get("turbidity_ntu"),
                r.get("temperature_c"),
                r.get("dissolved_oxygen_mgL"),
                json.dumps(alerts),
                json.dumps(recs),
            ),
        )
        self._conn.commit()

    def insert_distribution_event(self, home: str, path: List[str], volume_liters: float, cost: float) -> None:
        ts = time.time()
        self._conn.execute(
            "INSERT INTO distribution_events (ts, home, path, cost, volume_liters) VALUES (?, ?, ?, ?, ?)",
            (ts, home, json.dumps(path), cost, volume_liters),
        )
        # Aggregate daily total
        day = self._day_str(ts)
        self._conn.execute("""
            INSERT INTO distribution_daily (day, total_volume_liters)
            VALUES (?, ?)
            ON CONFLICT(day) DO UPDATE SET
                total_volume_liters = total_volume_liters + excluded.total_volume_liters
        """, (day, volume_liters))
        self._conn.commit()

    def insert_alert(self, alert_type: str, message: str, payload: Optional[Dict[str, Any]] = None) -> None:
        ts = time.time()
        self._conn.execute(
            "INSERT INTO alerts (ts, type, message, payload) VALUES (?, ?, ?, ?)",
            (ts, alert_type, message, json.dumps(payload or {})),
        )
        self._conn.commit()

    def close(self):
        self._conn.close()