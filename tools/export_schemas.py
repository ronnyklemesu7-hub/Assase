import json

SCHEMAS = {
    "env_summary": {
        "type": "object",
        "properties": {
            "available": {"type": "boolean"},
            "window_minutes": {"type": "integer"},
            "current_green_ratio": {"type": "number"},
            "baseline_green_ratio": {"type": ["number", "null"]},
            "tree_cover_drop_pct": {"type": ["number", "null"]},
            "excavation_events": {"type": "integer"},
            "activity_events": {"type": "integer"}
        },
        "required": ["available"]
    },
    "energy_stats": {
        "type": "object",
        "properties": {
            "day": {"type": "string"},
            "energy_kwh": {"type": "number"},
            "avg_power_w": {"type": "number"},
            "samples": {"type": "integer"}
        },
        "required": ["day", "energy_kwh", "avg_power_w", "samples"]
    },
    "water_recent_item": {
        "type": "object",
        "properties": {
            "ts": {"type": "number"},
            "ph": {"type": ["number", "null"]},
            "turbidity_ntu": {"type": ["number", "null"]},
            "temperature_c": {"type": ["number", "null"]},
            "dissolved_oxygen_mgL": {"type": ["number", "null"]},
            "alerts": {"type": "object"},
            "recommendations": {"type": "object"}
        },
        "required": ["ts", "alerts", "recommendations"]
    },
    "distribution_summary": {
        "type": "object",
        "properties": {
            "available": {"type": "boolean"},
            "days": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "day": {"type": "string"},
                        "total_volume_liters": {"type": "number"}
                    },
                    "required": ["day", "total_volume_liters"]
                }
            }
        },
        "required": ["available"]
    }
}


def main():
    print(json.dumps(SCHEMAS, indent=2))


if __name__ == "__main__":
    main()