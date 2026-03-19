import argparse
import time
import json
import os
from typing import Dict, List, Tuple

from src.distribution.route import Graph
from src.storage.sqlite_store import SQLiteStore, StoreConfig


def build_sample_graph() -> Graph:
    # Simple demo network: plant -> J1 -> H1/H2, and plant -> J2 -> H3
    g = Graph()
    g.add_edge("plant", "J1", 1.0)
    g.add_edge("J1", "H1", 1.0)
    g.add_edge("J1", "H2", 1.2)
    g.add_edge("plant", "J2", 1.5)
    g.add_edge("J2", "H3", 1.0)
    return g


def get_current_flow() -> float:
    """Helper to read real-time flow from filtration system."""
    filt_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    try:
        if os.path.exists(filt_path):
            with open(filt_path, 'r') as f:
                data = json.load(f)
                return data.get("telemetry", {}).get("flow_lpm", 45.0)
    except:
        pass
    return 45.0


def main():
    parser = argparse.ArgumentParser(description="Water Distribution Runner (simulation)")
    parser.add_argument("--homes", type=str, default="H1:10,H2:15,H3:8", help="Target homes and LPM demand 'H1:10,H2:15,...'")
    parser.add_argument("--duration", type=int, default=0, help="Simulation duration seconds (0=infinite)")
    parser.add_argument("--db", type=str, default="runs/data.db", help="SQLite DB for persistence")
    args = parser.parse_args()

    # Parse demands (LPM)
    demands: Dict[str, float] = {}
    for token in args.homes.split(","):
        if not token.strip():
            continue
        name, val = token.split(":")
        demands[name.strip()] = float(val.strip())

    g = build_sample_graph()
    store = SQLiteStore(StoreConfig(path=args.db))

    print(f"Starting distribution simulation. Infinite={args.duration == 0}")
    start = time.time()
    last = start
    try:
        while True:
            now = time.time()
            if args.duration > 0 and (now - start) >= args.duration:
                break
            
            dt_min = (now - last) / 60.0  # minutes
            last = now

            # Throttle based on filtration flow
            current_flow = get_current_flow()
            # If total demand > current_flow, we scale down everyone's delivery
            total_demand = sum(demands.values())
            throttle_ratio = min(1.0, current_flow / total_demand) if total_demand > 0 else 1.0

            # Route to each home from plant and allocate volume
            for home, lpm in demands.items():
                cost, path = g.shortest_path("plant", home)
                if not path:
                    continue
                
                # Apply throttle
                actual_lpm = lpm * throttle_ratio
                vol_liters = max(0.0, actual_lpm) * dt_min
                
                store.insert_distribution_event(
                    home=home, 
                    path=path, 
                    volume_liters=vol_liters, 
                    cost=cost
                )
                
                if vol_liters > 0:
                    print(f"[{time.strftime('%H:%M:%S')}] {home}: {actual_lpm:.1f} LPM (Throttle: {throttle_ratio:.1f})")
            
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("Stopping distribution simulation.")
    finally:
        store.close()


if __name__ == "__main__":
    main()