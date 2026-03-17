"""
Environmental Monitoring Module
- Tree Cover Monitoring
- Excavation Detection
- Activity Alert System
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any

import cv2
import numpy as np


@dataclass
class MonitorConfig:
    # Tree cover
    green_threshold: int = 120          # Minimum G channel to consider "green"
    green_saturation_min: int = 40      # Minimum S in HSV to reduce noise
    tree_alert_threshold: float = 0.30  # Alert if green ratio drops below this

    # Excavation detection
    bg_history: int = 300
    bg_var_thresh: int = 16
    excavation_area_min: int = 10_000     # Min contour area to consider big terrain change
    excavation_solid_thresh: float = 0.6  # Solidity threshold to filter blobs

    # Activity detection (motion magnitude)
    motion_mag_threshold: float = 2.0
    activity_area_min: int = 2_000


class EnvironmentalMonitor:
    def __init__(self, video_source: Optional[int | str] = None, config: Optional[MonitorConfig] = None):
        self.video_source = video_source  # Webcam index or video file path
        self.cfg = config or MonitorConfig()

        # Background subtractor for excavation/motion
        self._bg = cv2.createBackgroundSubtractorMOG2(
            history=self.cfg.bg_history,
            varThreshold=self.cfg.bg_var_thresh,
            detectShadows=True
        )

        # Optical flow state
        self._prev_gray: Optional[np.ndarray] = None

        # Baseline green ratio for tree cover normalization (learned over first frames)
        self._baseline_green_ratio: Optional[float] = None
        self._baseline_warmup_frames = 60
        self._baseline_samples: list[float] = []

    def analyze_tree_cover(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Estimate tree cover using a simple green-pixel ratio with HSV filtering.
        Returns:
            {
              "green_ratio": float [0..1],
              "baseline_green_ratio": Optional[float],
              "cover_change_pct": Optional[float],  # negative means loss
              "alert": bool
            }
        """
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Heuristic: green-ish hue range; keep saturation above threshold
        green_mask = cv2.inRange(hsv, (35, self.cfg.green_saturation_min, 20), (85, 255, 255))

        # Extra clamp: ensure G channel is sufficiently high (reduces false greens)
        g_channel = frame[:, :, 1]
        green_mask = cv2.bitwise_and(green_mask, cv2.inRange(g_channel, self.cfg.green_threshold, 255))

        green_pixels = int(np.count_nonzero(green_mask))
        total_pixels = frame.shape[0] * frame.shape[1]
        green_ratio = green_pixels / max(1, total_pixels)

        # Baseline learning
        if self._baseline_green_ratio is None and len(self._baseline_samples) < self._baseline_warmup_frames:
            self._baseline_samples.append(green_ratio)
            change_pct = None
            if len(self._baseline_samples) == self._baseline_warmup_frames:
                self._baseline_green_ratio = float(np.median(self._baseline_samples))
        else:
            if self._baseline_green_ratio is None and self._baseline_samples:
                self._baseline_green_ratio = float(np.median(self._baseline_samples))
            if self._baseline_green_ratio is not None and self._baseline_green_ratio > 0:
                change_pct = (green_ratio - self._baseline_green_ratio) / self._baseline_green_ratio * 100.0
            else:
                change_pct = None

        alert = False
        if self._baseline_green_ratio is not None:
            alert = green_ratio < self.cfg.tree_alert_threshold

        return {
            "green_ratio": round(green_ratio, 4),
            "baseline_green_ratio": None if self._baseline_green_ratio is None else round(self._baseline_green_ratio, 4),
            "cover_change_pct": None if (self._baseline_green_ratio is None) else round(change_pct if change_pct is not None else 0.0, 2),
            "alert": bool(alert),
        }

    def detect_excavation(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Detect large, persistent terrain changes using background subtraction and contour analysis.
        Returns:
            {
              "excavation_regions": [ (x, y, w, h) ],
              "count": int
            }
        """
        fg = self._bg.apply(frame)
        # Morphological cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, kernel, iterations=2)
        fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, kernel, iterations=2)
        # Threshold to binary
        _, bin_mask = cv2.threshold(fg, 200, 255, cv2.THRESH_BINARY)

        contours, _ = cv2.findContours(bin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions: list[tuple[int, int, int, int]] = []
        for c in contours:
            area = cv2.contourArea(c)
            if area < self.cfg.excavation_area_min:
                continue
            hull = cv2.convexHull(c)
            hull_area = cv2.contourArea(hull)
            solidity = float(area) / hull_area if hull_area > 0 else 0.0
            if solidity < self.cfg.excavation_solid_thresh:
                # Likely noise or thin structures; skip
                continue
            x, y, w, h = cv2.boundingRect(c)
            regions.append((int(x), int(y), int(w), int(h)))

        return {"excavation_regions": regions, "count": len(regions)}

    def detect_activity(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Basic activity via dense optical flow magnitude + contour area.
        Returns:
            {
              "motion_regions": [ (x, y, w, h) ],
              "avg_motion": float,
              "count": int
            }
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if self._prev_gray is None:
            self._prev_gray = gray
            return {"motion_regions": [], "avg_motion": 0.0, "count": 0}

        flow = cv2.calcOpticalFlowFarneback(
            self._prev_gray, gray,
            None, 0.5, 3, 15, 3, 5, 1.2, 0
        )
        self._prev_gray = gray

        mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        avg_motion = float(np.mean(mag))

        motion_mask = (mag > self.cfg.motion_mag_threshold).astype(np.uint8) * 255
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        motion_mask = cv2.morphologyEx(motion_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        contours, _ = cv2.findContours(motion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions: list[tuple[int, int, int, int]] = []
        for c in contours:
            area = cv2.contourArea(c)
            if area < self.cfg.activity_area_min:
                continue
            x, y, w, h = cv2.boundingRect(c)
            regions.append((int(x), int(y), int(w), int(h)))

        return {"motion_regions": regions, "avg_motion": round(avg_motion, 3), "count": len(regions)}

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Process a single video frame for all monitoring tasks.
        Returns a combined result payload suitable for logging or UI.
        """
        tree = self.analyze_tree_cover(frame)
        excavation = self.detect_excavation(frame)
        activity = self.detect_activity(frame)

        alerts = {
            "tree_cover": bool(tree.get("alert", False)),
            "excavation": excavation["count"] > 0,
            "activity": activity["count"] > 0,
        }
        return {"tree": tree, "excavation": excavation, "activity": activity, "alerts": alerts}
