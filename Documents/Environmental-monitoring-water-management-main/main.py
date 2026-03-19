import argparse
import json
import time
from typing import Optional, List, Tuple

import cv2
import yaml
import numpy as np

from src.environmental_monitoring.monitor import EnvironmentalMonitor, MonitorConfig
from src.environmental_monitoring.utils import apply_roi_mask, JsonlLogger
from src.environmental_monitoring.alerts import AlertManager, AlertRule, WebhookNotifier, ConsoleNotifier
from src.storage.sqlite_store import SQLiteStore, StoreConfig


def draw_overlays(frame, result, roi: Optional[List[Tuple[int, int]]] = None):
    # Draw ROI polygon if provided
    if roi:
        pts = np.array(roi, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(frame, [pts], isClosed=True, color=(0, 255, 255), thickness=2)

    # Tree cover text
    tree = result["tree"]
    base = tree["baseline_green_ratio"]
    base_text = f" (base {base*100:.1f}%)" if base is not None else ""
    cv2.putText(frame, f"Green: {tree['green_ratio']*100:.1f}%{base_text}",
                (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 200, 50), 4)

    # Excavation boxes
    for (x, y, w, h) in result["excavation"]["excavation_regions"]:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 165, 255), 2)
        cv2.putText(frame, "Excavation?", (x, max(15, y - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)

    # Activity boxes
    for (x, y, w, h) in result["activity"]["motion_regions"]:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 50, 50), 2)
        cv2.putText(frame, "Activity", (x, max(15, y - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 50, 50), 1)

    # Alerts line
    alerts = result["alerts"]
    alert_text = f"Alerts - Tree:{alerts['tree_cover']} Excav:{alerts['excavation']} Act:{alerts['activity']}"
    cv2.putText(frame, alert_text, (10, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 220, 220), 2)
    return frame


def load_config(path: Optional[str]) -> MonitorConfig:
    if not path:
        return MonitorConfig()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        m = data.get("monitor", {})
        return MonitorConfig(
            green_threshold=m.get("green_threshold", MonitorConfig.green_threshold),
            green_saturation_min=m.get("green_saturation_min", MonitorConfig.green_saturation_min),
            tree_alert_threshold=m.get("tree_alert_threshold", MonitorConfig.tree_alert_threshold),
            bg_history=m.get("bg_history", MonitorConfig.bg_history),
            bg_var_thresh=m.get("bg_var_thresh", MonitorConfig.bg_var_thresh),
            excavation_area_min=m.get("excavation_area_min", MonitorConfig.excavation_area_min),
            excavation_solid_thresh=m.get("excavation_solid_thresh", MonitorConfig.excavation_solid_thresh),
            motion_mag_threshold=m.get("motion_mag_threshold", MonitorConfig.motion_mag_threshold),
            activity_area_min=m.get("activity_area_min", MonitorConfig.activity_area_min),
        )
    except Exception as e:
        print(f"Failed to load config from {path}: {e}")
        return MonitorConfig()


def parse_roi(roi_str: str) -> Optional[List[Tuple[int, int]]]:
    """
    Parse ROI string format: "x1,y1;x2,y2;...;xn,yn"
    """
    if not roi_str:
        return None
    try:
        pts = []
        for pair in roi_str.split(";"):
            x_s, y_s = pair.split(",")
            pts.append((int(x_s.strip()), int(y_s.strip())))
        return pts
    except Exception as e:
        print(f"Invalid ROI format: {e}. Expected 'x1,y1;x2,y2;...'.")
        return None


def capture_baseline_green_ratio(source: Optional[int | str], roi: Optional[List[Tuple[int, int]]], frames: int = 60) -> float:
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("Failed to open video source for baseline capture.")
        return 0.0
    mon = EnvironmentalMonitor()
    samples = []
    try:
        for i in range(frames):
            ret, frame = cap.read()
            if not ret:
                break
            proc = apply_roi_mask(frame, roi)
            res = mon.analyze_tree_cover(proc)
            samples.append(res["green_ratio"])
        if samples:
            baseline = float(np.median(samples))
            print(f"Estimated baseline green ratio over {len(samples)} frames: {baseline*100:.2f}%")
            return baseline
        else:
            print("No frames captured for baseline.")
            return 0.0
    finally:
        cap.release()


def main():
    parser = argparse.ArgumentParser(description="Environmental Monitoring Runner")
    parser.add_argument("--video", type=str, default="", help="Video file path; empty for webcam")
    parser.add_argument("--config", type=str, default="", help="Path to YAML config file")
    parser.add_argument("--log", type=str, default="", help="Path to JSONL log file to write per-frame results")
    parser.add_argument("--db", type=str, default="", help="Path to SQLite DB for persisting environment results")
    parser.add_argument("--roi", type=str, default="", help="Polygon ROI as 'x1,y1;x2,y2;...;xn,yn'")
    parser.add_argument("--alerts", action="store_true", help="Enable alerts with rate limiting")
    parser.add_argument("--alert-interval", type=int, default=120, help="Default min seconds between repeated alerts per type")
    parser.add_argument("--alert-interval-tree", type=int, default=None, help="Override min seconds for tree_cover alerts")
    parser.add_argument("--alert-interval-excav", type=int, default=None, help="Override min seconds for excavation alerts")
    parser.add_argument("--alert-interval-activity", type=int, default=None, help="Override min seconds for activity alerts")
    parser.add_argument("--webhook-url", type=str, default="", help="Optional webhook URL to receive alert JSON payloads")
    parser.add_argument("--baseline-capture", action="store_true", help="Capture and print baseline green ratio over ~60 frames, then exit")
    parser.add_argument("--no-gui", action="store_true", help="Disable window display")
    args = parser.parse_args()

    source: Optional[int | str] = 0 if args.video == "" else args.video

    roi = parse_roi(args.roi)

    if args.baseline_capture:
        capture_baseline_green_ratio(source, roi, frames=60)
        return

    cfg = load_config(args.config)
    monitor = EnvironmentalMonitor(video_source=source, config=cfg)

    logger = JsonlLogger(args.log) if args.log else None
    store = SQLiteStore(StoreConfig(path=args.db)) if args.db else None

    alert_mgr = None
    if args.alerts:
        notifiers = [ConsoleNotifier()]
        if args.webhook_url:
            notifiers.append(WebhookNotifier(args.webhook_url))
        alert_mgr = AlertManager(notifiers=notifiers)
    # Define alert rules with per-type overrides
    tree_interval = args.alert_interval_tree if args.alert_interval_tree is not None else args.alert_interval
    excav_interval = args.alert_interval_excav if args.alert_interval_excav is not None else args.alert_interval
    act_interval = args.alert_interval_activity if args.alert_interval_activity is not None else args.alert_interval
    tree_rule = AlertRule(key="tree_cover", min_interval_sec=tree_interval)
    excav_rule = AlertRule(key="excavation", min_interval_sec=excav_interval)
    act_rule = AlertRule(key="activity", min_interval_sec=act_interval)

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("Failed to open video source. Check camera or file path.")
        return

    fps_last = time.time()
    frames = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Apply ROI mask if provided
            proc_frame = apply_roi_mask(frame, roi)

            result = monitor.process_frame(proc_frame)
            frames += 1

            # Alerts
            if alert_mgr:
                alert_mgr.send_alert_if_needed(
                    tree_rule,
                    active=bool(result["alerts"]["tree_cover"]),
                    message=f"Tree cover low: {result['tree']['green_ratio']*100:.1f}%"
                )
                alert_mgr.send_alert_if_needed(
                    excav_rule,
                    active=result["excavation"]["count"] > 0,
                    message=f"Excavation regions detected: {result['excavation']['count']}",
                    payload={"regions": result["excavation"]["excavation_regions"][:5]}
                )
                alert_mgr.send_alert_if_needed(
                    act_rule,
                    active=result["activity"]["count"] > 0,
                    message=f"Activity detected: {result['activity']['count']} motion regions"
                )

            # Write log if enabled
            if logger:
                logger.write({
                    "alerts": result["alerts"],
                    "tree": result["tree"],
                    "excavation": {"count": result["excavation"]["count"]},
                    "activity": {"count": result["activity"]["count"]},
                })

            # Persist to SQLite if enabled
            if store:
                store.insert_env(result)

            if not args.no_gui:
                vis = draw_overlays(frame.copy(), result, roi=roi)
                cv2.imshow("Environmental Monitoring", vis)
                key = cv2.waitKey(1) & 0xFF
                if key == 27 or key == ord('q'):  # ESC or q
                    break

            # Print summary every 60 frames
            if frames % 60 == 0:
                now = time.time()
                fps = 60.0 / max(1e-3, (now - fps_last))
                fps_last = now
                alerts = result["alerts"]
                print(f"[{time.strftime('%H:%M:%S')}] FPS ~ {fps:.1f} | Alerts: {alerts} | "
                      f"Green={result['tree']['green_ratio']*100:.1f}% "
                      f"Excav={result['excavation']['count']} Act={result['activity']['count']}")
    finally:
        cap.release()
        if not args.no_gui:
            cv2.destroyAllWindows()
        if store:
            store.close()


if __name__ == "__main__":
    main()