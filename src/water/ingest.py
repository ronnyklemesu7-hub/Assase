from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Dict, Optional, Iterator, Any

try:
    import serial  # type: ignore
except Exception:
    serial = None  # optional dependency


@dataclass
class WaterReading:
    ts: float
    ph: float
    turbidity_ntu: float
    temperature_c: Optional[float] = None
    dissolved_oxygen_mgL: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ts": self.ts,
            "ph": self.ph,
            "turbidity_ntu": self.turbidity_ntu,
            "temperature_c": self.temperature_c,
            "dissolved_oxygen_mgL": self.dissolved_oxygen_mgL,
        }


class MockWaterSource:
    """
    Generates synthetic water quality readings for testing/demo.
    """

    def __init__(self, period_sec: float = 1.0, ph_base: float = 7.0, turb_base: float = 5.0):
        self.period_sec = period_sec
        self.ph_base = ph_base
        self.turb_base = turb_base

    def stream(self) -> Iterator[WaterReading]:
        while True:
            now = time.time()
            ph = self.ph_base + random.uniform(-0.5, 0.5)
            turb = max(0.0, self.turb_base + random.uniform(-2.0, 2.0))
            temp = 20.0 + random.uniform(-2.0, 2.0)
            yield WaterReading(ts=now, ph=round(ph, 2), turbidity_ntu=round(turb, 2), temperature_c=round(temp, 2))
            time.sleep(self.period_sec)


class SerialWaterSource:
    """
    Placeholder serial reader for real sensor integration.
    Expected line protocol (example CSV): ph,turbidity,temperature,dissolved_oxygen
    """

    def __init__(self, port: str, baudrate: int = 9600, period_sec: float = 1.0):
        if serial is None:
            raise RuntimeError("pyserial not installed. Please install via 'pip install pyserial'.")
        self.port = port
        self.baudrate = baudrate
        self.period_sec = period_sec
        self._ser = None

    def open(self):
        self._ser = serial.Serial(self.port, self.baudrate, timeout=1)

    def close(self):
        if self._ser:
            self._ser.close()
            self._ser = None

    def stream(self) -> Iterator[WaterReading]:
        if self._ser is None:
            self.open()
        try:
            while True:
                line = self._ser.readline().decode("utf-8", errors="ignore").strip()
                now = time.time()
                if line:
                    try:
                        parts = [p.strip() for p in line.split(",")]
                        ph = float(parts[0])
                        turb = float(parts[1])
                        temp = float(parts[2]) if len(parts) > 2 and parts[2] else None
                        do = float(parts[3]) if len(parts) > 3 and parts[3] else None
                        yield WaterReading(ts=now, ph=ph, turbidity_ntu=turb, temperature_c=temp, dissolved_oxygen_mgL=do)
                    except Exception:
                        # If parsing fails, skip
                        pass
                time.sleep(self.period_sec)
        finally:
            self.close()