from pydantic import BaseModel
from typing import Literal

class GroundPacket(BaseModel):
    robot_id: str
    gps_lat: float
    gps_lon: float
    timestamp: str  # ISO8601
    soil_classification: Literal["CLEAN", "MODERATE", "CRITICAL"]
    confidence_score: float
    dispenser_action: Literal["NONE", "SEEDS_ONLY", "BIOCHAR_AND_SEEDS"]
    battery_pct: int
    patrol_waypoint_index: int

class AquaPacket(BaseModel):
    robot_id: str
    gps_lat: float
    gps_lon: float
    timestamp: str
    turbidity_ntu: float
    ph_value: float
    camera_water_classification: Literal["CLEAN", "MODERATE", "CRITICAL"]
    dual_stream_verdict: Literal["CLEAN", "MODERATE", "CRITICAL"]  # server-validated
    neutralizer_dispensed_ml: float
    dye_marker_dropped: bool
    battery_pct: int
