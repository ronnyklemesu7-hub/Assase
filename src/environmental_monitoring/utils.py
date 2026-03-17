import json
import os
from datetime import datetime
from typing import List, Tuple, Optional, Dict, Any

def apply_roi_mask(frame: 'np.ndarray', roi: Optional[List[Tuple[int, int]]]) -> 'np.ndarray':
    """
    Apply a polygonal ROI mask to the frame. If roi is None or empty, returns frame unchanged.
    roi: list of (x, y) vertices.
    """
    import cv2
    import numpy as np
    if not roi:
        return frame
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    pts = np.array(roi, dtype=np.int32)
    cv2.fillPoly(mask, [pts], 255)
    if frame.ndim == 3:
        masked = cv2.bitwise_and(frame, frame, mask=mask)
    else:
        masked = cv2.bitwise_and(frame, mask)
    return masked


class JsonlLogger:
    """
    Simple JSONL logger that appends one JSON object per line with timestamp.
    """

    def __init__(self, path: str):
        self.path = path
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)

    def write(self, payload: Dict[str, Any]) -> None:
        record = {"ts": datetime.utcnow().isoformat() + "Z", **payload}
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")