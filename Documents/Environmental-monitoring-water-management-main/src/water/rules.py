from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any, Optional

from .ingest import WaterReading


@dataclass
class WaterRulesConfig:
    ph_min: float = 6.5
    ph_max: float = 8.5
    turbidity_max_ntu: float = 10.0  # WHO guideline for treated water
    temp_max_c: float = 35.0         # arbitrary operational threshold
    # Contaminant thresholds (example values; tune per sensor calibration)
    lead_max_mgL: Optional[float] = 0.01
    arsenic_max_mgL: Optional[float] = 0.01
    nitrate_max_mgL: Optional[float] = 50.0


def evaluate(reading: WaterReading, cfg: WaterRulesConfig, contaminants: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    alerts: Dict[str, bool] = {}
    recommendations: Dict[str, str] = {}

    # pH
    alerts["ph_out_of_range"] = not (cfg.ph_min <= reading.ph <= cfg.ph_max)
    if alerts["ph_out_of_range"]:
        if reading.ph < cfg.ph_min:
            recommendations["ph"] = "Add alkaline agent to raise pH."
        else:
            recommendations["ph"] = "Add acidic agent to lower pH."

    # Turbidity
    alerts["turbidity_high"] = reading.turbidity_ntu > cfg.turbidity_max_ntu
    if alerts["turbidity_high"]:
        recommendations["turbidity"] = "Intensify filtration; backwash filters and inspect debris removal."

    # Temperature (optional)
    if reading.temperature_c is not None:
        alerts["temperature_high"] = reading.temperature_c > cfg.temp_max_c
        if alerts["temperature_high"]:
            recommendations["temperature"] = "Investigate heating sources; consider cooling or shaded routing."

    # Contaminants (optional dict: {"lead": mg/L, "arsenic": mg/L, "nitrate": mg/L, ...})
    contaminants = contaminants or {}
    lead = contaminants.get("lead")
    if lead is not None and cfg.lead_max_mgL is not None:
        alerts["lead_high"] = lead > cfg.lead_max_mgL
        if alerts["lead_high"]:
            recommendations["lead"] = "Use adsorption media (activated carbon or specific lead-removal resin) and verify post-treatment."

    arsenic = contaminants.get("arsenic")
    if arsenic is not None and cfg.arsenic_max_mgL is not None:
        alerts["arsenic_high"] = arsenic > cfg.arsenic_max_mgL
        if alerts["arsenic_high"]:
            recommendations["arsenic"] = "Apply adsorption (activated alumina) or reverse osmosis; ensure proper disposal of spent media."

    nitrate = contaminants.get("nitrate")
    if nitrate is not None and cfg.nitrate_max_mgL is not None:
        alerts["nitrate_high"] = nitrate > cfg.nitrate_max_mgL
        if alerts["nitrate_high"]:
            recommendations["nitrate"] = "Consider ion exchange or reverse osmosis for nitrate reduction."

    out = {
        "alerts": alerts,
        "recommendations": recommendations,
        "reading": reading.to_dict(),
    }
    if contaminants:
        out["contaminants"] = contaminants
    return out