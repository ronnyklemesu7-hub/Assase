from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import time
from typing import Optional, AsyncIterator, Dict, Any

from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from src.energy.storage import EnergyDB, EnergyDBConfig
from src.filtration.system import FiltrationSystem
from src.water.rules import WaterRulesConfig, evaluate
from src.water.ingest import WaterReading

app = FastAPI(title="Environmental Monitoring Backend", version="0.1.0")

# Allow local dev frontends (adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
_filtration = FiltrationSystem()
_energy_db_path = os.environ.get("ENERGY_DB", "runs/energy.db")
_data_db_path = os.environ.get("DATA_DB", "runs/data.db")
_water_rules_cfg = WaterRulesConfig()


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/health/detail")
async def health_detail():
    detail = {
        "status": "ok",
        "energy_db": _energy_db_path,
        "data_db": _data_db_path,
        "data": {"env_frames": 0, "water_readings": 0},
    }
    # Probe data DB counts if exists
    if os.path.exists(_data_db_path):
        try:
            conn = sqlite3.connect(_data_db_path)
            cur = conn.cursor()
            cur.execute("SELECT COUNT(1) FROM env_frames")
            detail["data"]["env_frames"] = int(cur.fetchone()[0])
            cur.execute("SELECT COUNT(1) FROM water_readings")
            detail["data"]["water_readings"] = int(cur.fetchone()[0])
            conn.close()
        except Exception as e:
            detail["status"] = "degraded"
            detail["error"] = f"DATA_DB error: {e}"
    else:
        detail["status"] = "degraded"
        detail["error"] = "DATA_DB missing"
    return detail


@app.get("/energy/stats")
async def energy_stats():
    try:
        if not os.path.exists(_energy_db_path):
            return {"day": time.strftime("%Y-%m-%d"), "energy_kwh": 0.0, "avg_power_w": 0.0, "samples": 0, "note": "energy DB not found"}
        db = EnergyDB(EnergyDBConfig(path=_energy_db_path))
        stats = db.get_day_stats()
        db.close()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def index():
    return {
        "name": "Environmental Monitoring Backend",
        "version": "0.1.0",
        "routes": [
            "/ping",
            "/health",
            "/health/detail",
            "/energy/stats",
            "/filtration/status",
            "/env/alerts?log=runs/monitor_log.jsonl",
            "/env/recent",
            "/env/summary",
            "/water/latest?log=runs/water_log.jsonl",
            "/water/recent",
            "/water/config",
            "/water/evaluate",
            "/stats/overview",
            "/distribution/summary",
        ],
        "docs": "/docs"
    }

@app.get("/ping")
async def ping():
    return {"pong": True}

@app.get("/filtration/status")
async def filtration_status():
    # Perform a single step to simulate current state; in production, this would be managed by a service
    status = _filtration.step()
    return status


async def _tail_jsonl(path: str) -> AsyncIterator[bytes]:
    """
    Async tail of a JSONL file; yields lines as NDJSON for streaming.
    Starts reading from end of file and only streams new lines.
    Handles file rotation/deletion by reopening when missing.
    """
    while True:
        if not os.path.exists(path):
            # Wait for file to appear
            await asyncio.sleep(0.5)
            continue
        try:
            with open(path, "rb") as f:
                f.seek(0, os.SEEK_END)
                while True:
                    line = f.readline()
                    if not line:
                        await asyncio.sleep(0.5)
                        # Break if file disappeared during wait (rotation)
                        if not os.path.exists(path):
                            break
                        continue
                    try:
                        _ = json.loads(line.decode("utf-8"))
                        yield line
                    except Exception:
                        # Skip invalid lines
                        continue
        except Exception:
            # On read errors, backoff slightly and retry
            await asyncio.sleep(0.5)
            continue


@app.get("/env/alerts")
async def env_alerts_stream(log: Optional[str] = "runs/monitor_log.jsonl"):
    # Stream alerts JSONL as NDJSON
    if not log:
        raise HTTPException(status_code=400, detail="log parameter required")
    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    return StreamingResponse(_tail_jsonl(log), media_type="application/x-ndjson", headers=headers)

@app.get("/water/latest")
async def water_latest(log: Optional[str] = "runs/water_log.jsonl"):
    # Return last JSON object from a JSONL water log if present
    if not log or not os.path.exists(log):
        return {"available": False}
    try:
        last = None
        with open(log, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                last = json.loads(line)
        return {"available": last is not None, "latest": last}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/env/recent")
async def env_recent(limit: int = 50):
    # Return recent environment frames stored in SQLite (runs/data.db)
    if not os.path.exists(_data_db_path):
        return {"available": False, "items": [], "count": 0}
    try:
        conn = sqlite3.connect(_data_db_path)
        cur = conn.cursor()
        cur.execute(
            "SELECT ts, green_ratio, baseline_green_ratio, cover_change_pct, tree_alert, excavation_count, activity_count, payload "
            "FROM env_frames ORDER BY ts DESC LIMIT ?",
            (limit,),
        )
        rows = cur.fetchall()
        conn.close()
        items = []
        for r in rows:
            items.append({
                "ts": r[0],
                "green_ratio": r[1],
                "baseline_green_ratio": r[2],
                "cover_change_pct": r[3],
                "tree_alert": bool(r[4]),
                "excavation_count": r[5],
                "activity_count": r[6],
                "payload": json.loads(r[7]) if r[7] else None
            })
        return {"available": True, "items": items, "count": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/water/recent")
async def water_recent(limit: int = 50):
    # Return recent water readings stored in SQLite (runs/data.db)
    if not os.path.exists(_data_db_path):
        return {"available": False, "items": [], "count": 0}
    try:
        try:
            limit = int(limit)
        except Exception:
            limit = 50
        limit = max(1, min(500, limit))

        conn = sqlite3.connect(_data_db_path)
        cur = conn.cursor()
        cur.execute(
            "SELECT ts, ph, turbidity_ntu, temperature_c, dissolved_oxygen_mgL, alerts, recommendations "
            "FROM water_readings ORDER BY ts DESC LIMIT ?",
            (limit,),
        )
        rows = cur.fetchall()
        conn.close()
        items = []
        for r in rows:
            items.append({
                "ts": r[0],
                "ph": r[1],
                "turbidity_ntu": r[2],
                "temperature_c": r[3],
                "dissolved_oxygen_mgL": r[4],
                "alerts": json.loads(r[5]) if r[5] else {},
                "recommendations": json.loads(r[6]) if r[6] else {},
            })
        return {"available": True, "items": items, "count": len(items)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats/overview")
async def stats_overview():
    """
    Summarize counts from persisted data and include today's energy stats.
    """
    overview = {"env_frames": 0, "water_readings": 0, "distribution_today_liters": 0.0, "energy": None}
    # Count env and water records + distribution
    if os.path.exists(_data_db_path):
        try:
            conn = sqlite3.connect(_data_db_path)
            cur = conn.cursor()
            cur.execute("SELECT COUNT(1) FROM env_frames")
            overview["env_frames"] = int(cur.fetchone()[0])
            cur.execute("SELECT COUNT(1) FROM water_readings")
            overview["water_readings"] = int(cur.fetchone()[0])
            cur.execute("SELECT total_volume_liters FROM distribution_daily WHERE day = date('now','localtime')")
            row = cur.fetchone()
            if row:
                overview["distribution_today_liters"] = float(row[0])
            conn.close()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"DATA_DB error: {e}")
    # Get energy day stats
    try:
        db = EnergyDB(EnergyDBConfig(path=_energy_db_path))
        overview["energy"] = db.get_day_stats()
        db.close()
    except Exception as e:
        overview["energy"] = {"error": str(e)}
    return overview


@app.get("/distribution/summary")
async def distribution_summary():
    if not os.path.exists(_data_db_path):
        return {"available": False}
    try:
        conn = sqlite3.connect(_data_db_path)
        cur = conn.cursor()
        cur.execute("SELECT day, total_volume_liters FROM distribution_daily ORDER BY day DESC LIMIT 7")
        rows = cur.fetchall()
        conn.close()
        return {"available": True, "days": [{"day": r[0], "total_volume_liters": r[1]} for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/env/summary")
async def env_summary(minutes: int = 10):
    """
    Compute recent tree cover percentage and drop vs baseline over a time window.
    - minutes: window size to average current green_ratio.
    """
    if not os.path.exists(_data_db_path):
        return {"available": False}
    try:
        now = time.time()
        since = now - minutes * 60
        conn = sqlite3.connect(_data_db_path)
        cur = conn.cursor()
        cur.execute(
            "SELECT green_ratio, baseline_green_ratio, excavation_count, activity_count "
            "FROM env_frames WHERE ts >= ? ORDER BY ts DESC",
            (since,),
        )
        rows = cur.fetchall()
        conn.close()

        if not rows:
            return {"available": False}

        green_values = [r[0] for r in rows if r[0] is not None]
        baseline_values = [r[1] for r in rows if r[1] is not None]
        excavation_events = sum(1 for r in rows if (r[2] or 0) > 0)
        activity_events = sum(1 for r in rows if (r[3] or 0) > 0)

        current_green = sum(green_values) / len(green_values) if green_values else 0.0
        baseline = sum(baseline_values) / len(baseline_values) if baseline_values else None
        drop_pct = None
        if baseline and baseline > 0:
            drop_pct = (baseline - current_green) / baseline * 100.0

        return {
            "available": True,
            "window_minutes": minutes,
            "count": int(len(rows)),
            "current_green_ratio": round(current_green, 4),
            "baseline_green_ratio": None if baseline is None else round(baseline, 4),
            "tree_cover_drop_pct": None if drop_pct is None else round(drop_pct, 2),
            "excavation_events": int(excavation_events),
            "activity_events": int(activity_events),
            "excavation_rate_per_min": round(excavation_events / minutes, 4) if minutes > 0 else 0.0,
            "activity_rate_per_min": round(activity_events / minutes, 4) if minutes > 0 else 0.0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/water/config")
async def water_config():
    """
    Return current water rules thresholds and contaminant limits.
    """
    return {
        "ph_min": _water_rules_cfg.ph_min,
        "ph_max": _water_rules_cfg.ph_max,
        "turbidity_max_ntu": _water_rules_cfg.turbidity_max_ntu,
        "temp_max_c": _water_rules_cfg.temp_max_c,
        "lead_max_mgL": _water_rules_cfg.lead_max_mgL,
        "arsenic_max_mgL": _water_rules_cfg.arsenic_max_mgL,
        "nitrate_max_mgL": _water_rules_cfg.nitrate_max_mgL,
    }


@app.post("/water/evaluate")
async def water_evaluate(payload: Dict[str, Any] = Body(...)):
    """
    Evaluate a single water reading with optional contaminants.
    Expected JSON:
    {
      "ph": float,
      "turbidity_ntu": float,
      "temperature_c": float | null,
      "dissolved_oxygen_mgL": float | null,
      "contaminants": { "lead": float, "arsenic": float, "nitrate": float } | null
    }
    """
    try:
        if "ph" not in payload or "turbidity_ntu" not in payload:
            raise ValueError("Fields 'ph' and 'turbidity_ntu' are required")
        ph = max(0.0, float(payload.get("ph")))
        turb = max(0.0, float(payload.get("turbidity_ntu")))
        temp = payload.get("temperature_c")
        do = payload.get("dissolved_oxygen_mgL")
        temp_f = float(temp) if temp is not None else None
        do_f = float(do) if do is not None else None
        contaminants_in = payload.get("contaminants") or {}
        if not isinstance(contaminants_in, dict):
            raise ValueError("'contaminants' must be an object with numeric values")
        # Normalize contaminants to floats
        contaminants: Dict[str, float] = {}
        for k, v in contaminants_in.items():
            if v is None:
                continue
            contaminants[k] = float(v)

        reading = WaterReading(
            ts=time.time(),
            ph=ph,
            turbidity_ntu=turb,
            temperature_c=temp_f,
            dissolved_oxygen_mgL=do_f,
        )
        result = evaluate(reading, _water_rules_cfg, contaminants=contaminants if contaminants else None)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")