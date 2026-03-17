import random
import time
import json
import os
from dataclasses import dataclass
from typing import Iterator


@dataclass
class TurbineReading:
    ts: float
    power_w: float  # instantaneous power in Watts
    rpm: float      # turbine speed


class SerialTurbineSource:
    """
    Reads hardware turbine telemetry from a serial port.
    Payload format expected (JSON): {"power_w": 150.5, "rpm": 1205}
    """
    def __init__(self, port: str, baudrate: int = 9600, period_sec: float = 1.0):
        self.port = port
        self.baudrate = baudrate
        self.period_sec = period_sec
        try:
            import serial
            self.ser = serial.Serial(port, baudrate, timeout=period_sec)
        except ImportError:
            raise RuntimeError("pyserial not installed. Please install via 'pip install pyserial'.")
        except Exception as e:
            raise RuntimeError(f"Could not open serial port {port}. Hardware required. Error: {e}")

    def stream(self) -> Iterator[TurbineReading]:
        with self.ser:
            while True:
                line = self.ser.readline().decode('utf-8').strip()
                if line:
                    try:
                        data = json.loads(line)
                        yield TurbineReading(
                            ts=time.time(),
                            power_w=float(data.get("power_w", 0.0)),
                            rpm=float(data.get("rpm", 0.0))
                        )
                    except json.JSONDecodeError:
                        pass
                time.sleep(self.period_sec)