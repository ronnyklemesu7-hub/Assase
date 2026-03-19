from __future__ import annotations

import random
import time
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, Any, Optional

from src.environmental_monitoring.utils import JsonlLogger


class State(Enum):
    IDLE = auto()
    FILTERING = auto()
    CLEAR_NETS = auto()    # Lifting nets via gears
    BACKWASH = auto()
    ALERT = auto()


@dataclass
class FiltrationConfig:
    net_capacity_max: float = 100.0   # percent
    net_clear_threshold: float = 75.0 # trigger gear lift
    bottle_clog_threshold: float = 85.0 # trigger backwash
    clear_duration_sec: int = 8
    backwash_duration_sec: int = 12
    cycle_period_sec: float = 1.0


@dataclass
class Telemetry:
    ts: float
    net_load_pct: float      # Primary debris in basin
    bottle_clog_pct: float   # Clogging in sand/charcoal layers
    flow_lpm: float          # Main flow to turbine


class MechaSensors:
    def __init__(self):
        self._net_load = 0.0
        self._clog = 0.0
        self._flow = 45.0

    def read(self) -> Telemetry:
        # Simulate debris caught by nets and filter clogging
        self._net_load = min(100.0, self._net_load + random.uniform(0.8, 2.5))
        self._clog = min(100.0, self._clog + random.uniform(0.3, 1.2))
        # Flow drops as filter clogs
        self._flow = max(5.0, 45.0 * (1.0 - (self._clog / 100.0)))
        return Telemetry(
            ts=time.time(), 
            net_load_pct=round(self._net_load, 1), 
            bottle_clog_pct=round(self._clog, 1), 
            flow_lpm=round(self._flow, 1)
        )

    def reset_nets(self):
        # Gears lift nets, clearing primary debris
        self._net_load = max(0.0, self._net_load - random.uniform(70.0, 95.0))

    def backwash_bottle(self):
        # Reverse flow clears sand/charcoal layers
        self._clog = max(5.0, self._clog - random.uniform(60.0, 85.0))


class MechaActuators:
    def __init__(self):
        self.gears_active = False
        self.backwash_on = False
        self.pump_active = True

    def lift_nets(self):
        self.gears_active = True

    def stop_gears(self):
        self.gears_active = False

    def start_backwash(self):
        self.backwash_on = True

    def stop_backwash(self):
        self.backwash_on = False


@dataclass
class FiltrationSystem:
    cfg: FiltrationConfig = field(default_factory=FiltrationConfig)
    sensors: MechaSensors = field(default_factory=MechaSensors)
    actuators: MechaActuators = field(default_factory=MechaActuators)
    state: State = State.IDLE
    last_transition_ts: float = field(default_factory=time.time)

    def step(self) -> Dict[str, Any]:
        tel = self.sensors.read()
        alerts = {
            "nets_full": tel.net_load_pct >= self.cfg.net_clear_threshold,
            "filter_clogged": tel.bottle_clog_pct >= self.cfg.bottle_clog_threshold,
        }

        now = time.time()

        if self.state in (State.IDLE, State.FILTERING):
            self.state = State.FILTERING
            if alerts["nets_full"]:
                self.state = State.CLEAR_NETS
                self.actuators.lift_nets()
                self.last_transition_ts = now
            elif alerts["filter_clogged"]:
                self.state = State.BACKWASH
                self.actuators.start_backwash()
                self.last_transition_ts = now

        elif self.state == State.CLEAR_NETS:
            if now - self.last_transition_ts >= self.cfg.clear_duration_sec:
                self.actuators.stop_gears()
                self.sensors.reset_nets()
                self.state = State.FILTERING
                self.last_transition_ts = now

        elif self.state == State.BACKWASH:
            if now - self.last_transition_ts >= self.cfg.backwash_duration_sec:
                self.actuators.stop_backwash()
                self.sensors.backwash_bottle()
                self.state = State.FILTERING
                self.last_transition_ts = now

        status = {
            "ts": tel.ts,
            "state": self.state.name,
            "telemetry": {
                "net_load_pct": tel.net_load_pct,
                "bottle_clog_pct": tel.bottle_clog_pct,
                "flow_lpm": tel.flow_lpm,
            },
            "actuators": {
                "gears_active": self.actuators.gears_active,
                "backwash_on": self.actuators.backwash_on,
                "pump_active": self.actuators.pump_active,
            },
            "last_action": {
                "type": self.state.name,
                "ts": self.last_transition_ts
            },
            "alerts": alerts,
        }
        return status

    def run(self, duration_sec: Optional[int] = None, logger: Optional[JsonlLogger] = None):
        start = time.time()
        try:
            while True:
                status = self.step()
                print(f"[{time.strftime('%H:%M:%S')}] State={status['state']} | Nets={status['telemetry']['net_load_pct']}% "
                      f"Bottle={status['telemetry']['bottle_clog_pct']}% Flow={status['telemetry']['flow_lpm']}LPM "
                      f"| Gears={status['actuators']['gears_active']} Backwash={status['actuators']['backwash_on']}")
                if logger:
                    logger.write(status)
                time.sleep(self.cfg.cycle_period_sec)
                if duration_sec is not None and (time.time() - start) >= duration_sec:
                    break
        except KeyboardInterrupt:
            print("Stopping filtration system.")
