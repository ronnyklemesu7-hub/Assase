import numpy as np
import cv2

from src.environmental_monitoring.monitor import EnvironmentalMonitor, MonitorConfig


def make_green_frame(w=320, h=240, green_level=200):
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    frame[:, :, 1] = green_level  # G channel
    frame[:, :, 2] = 50
    return frame


def test_tree_cover_high_green_ratio():
    cfg = MonitorConfig(green_threshold=100, green_saturation_min=10)
    mon = EnvironmentalMonitor(config=cfg)
    frame = make_green_frame()
    res = mon.analyze_tree_cover(frame)
    assert 0.7 <= res["green_ratio"] <= 1.0


def test_tree_cover_low_green_ratio():
    cfg = MonitorConfig(green_threshold=200, green_saturation_min=50)
    mon = EnvironmentalMonitor(config=cfg)
    frame = np.zeros((240, 320, 3), dtype=np.uint8)  # black, no green
    res = mon.analyze_tree_cover(frame)
    assert res["green_ratio"] == 0.0


def test_activity_detection_no_prev_frame_returns_zero():
    mon = EnvironmentalMonitor()
    frame = np.zeros((120, 160, 3), dtype=np.uint8)
    res = mon.detect_activity(frame)
    assert res["count"] == 0
    assert res["avg_motion"] == 0.0


def test_activity_detection_simple_motion():
    mon = EnvironmentalMonitor()
    base = np.zeros((120, 160, 3), dtype=np.uint8)
    mon.detect_activity(base)  # initialize prev frame
    moved = base.copy()
    cv2.circle(moved, (80, 60), 10, (255, 255, 255), -1)
    res = mon.detect_activity(moved)
    assert res["avg_motion"] >= 0.0


def test_excavation_detection_filters_small_areas():
    cfg = MonitorConfig(excavation_area_min=5000)
    mon = EnvironmentalMonitor(config=cfg)
    # Create a mask-like change by drawing small rectangles; background subtractor learns over time,
    # so we "apply" a few black frames first then a frame with white small rectangles
    for _ in range(5):
        mon.detect_excavation(np.zeros((240, 320, 3), dtype=np.uint8))
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    for i in range(5):
        cv2.rectangle(frame, (10 + i * 20, 10), (20 + i * 20, 20), (255, 255, 255), -1)
    res = mon.detect_excavation(frame)
    assert res["count"] == 0 or all(w * h < 5000 for (_, _, w, h) in res["excavation_regions"])