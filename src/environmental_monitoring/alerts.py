import json
import time
from dataclasses import dataclass
from typing import Dict, Optional, Protocol, Any, List
from urllib import request


class Notifier(Protocol):
    def notify(self, title: str, message: str, payload: Optional[Dict[str, Any]] = None) -> None:
        ...


class ConsoleNotifier:
    def notify(self, title: str, message: str, payload: Optional[Dict[str, Any]] = None) -> None:
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[ALERT {ts}] {title}: {message}" + (f" | {payload}" if payload else ""))


class WebhookNotifier:
    def __init__(self, url: str, timeout: int = 5):
        self.url = url
        self.timeout = timeout

    def notify(self, title: str, message: str, payload: Optional[Dict[str, Any]] = None) -> None:
        body = {"title": title, "message": message, "payload": payload or {}}
        data = json.dumps(body).encode("utf-8")
        req = request.Request(self.url, data=data, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                _ = resp.read()
        except Exception as e:
            # Fallback to console if webhook fails
            ts = time.strftime("%Y-%m-%d %H:%M:%S")
            print(f"[ALERT-WEBHOOK-ERROR {ts}] {title}: {e}")


@dataclass
class AlertRule:
    key: str                 # unique key for the alert, e.g., "tree_cover"
    min_interval_sec: int    # minimum seconds between repeated alerts for same key


class AlertManager:
    def __init__(self, notifiers: Optional[List[Notifier]] = None):
        self.notifiers: List[Notifier] = notifiers if notifiers else [ConsoleNotifier()]
        self._last_sent: Dict[str, float] = {}
        self._last_state: Dict[str, bool] = {}

    def should_send(self, key: str, now: float, min_interval_sec: int, state_change: bool) -> bool:
        # Always allow on rising edge (state change to True)
        if state_change:
            return True
        # Otherwise rate limit repeats
        last = self._last_sent.get(key, 0.0)
        return (now - last) >= min_interval_sec

    def send_alert_if_needed(self, rule: AlertRule, active: bool, message: str, payload: Optional[Dict[str, Any]] = None) -> bool:
        now = time.time()
        prev = self._last_state.get(rule.key, False)
        state_change = (active != prev)
        sent = False
        if active and self.should_send(rule.key, now, rule.min_interval_sec, state_change):
            for n in self.notifiers:
                n.notify(title=rule.key, message=message, payload=payload)
            self._last_sent[rule.key] = now
            sent = True
        # Track last state regardless
        self._last_state[rule.key] = active
        return sent