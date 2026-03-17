import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = ROOT / "runs"


def spawn(cmd, cwd=None):
    print(f"Starting: {cmd}")
    return subprocess.Popen(cmd, cwd=cwd or ROOT, shell=True)


def main():
    RUNS.mkdir(exist_ok=True)
    procs = []
    try:
        # Environment monitoring (webcam, headless, log + db)
        procs.append(spawn(f"{sys.executable} main.py --no-gui --log runs/monitor_log.jsonl --db runs/data.db"))

        # Water monitoring (mock)
        procs.append(spawn(f"{sys.executable} water_main.py --period 1.0 --log runs/water_log.jsonl --db runs/data.db"))

        # Filtration loop (sim)
        procs.append(spawn(f"{sys.executable} filtration_main.py --log runs/filtration_log.jsonl --period 1.0"))

        # Energy telemetry
        procs.append(spawn(f"{sys.executable} energy_main.py --period 1.0 --db runs/energy.db"))

        # Distribution simulator
        procs.append(spawn(f"{sys.executable} distribution_main.py --duration 300 --db runs/data.db"))

        # Backend API
        procs.append(spawn(f"{sys.executable} backend_main.py --host 0.0.0.0 --port 8000"))

        # Probe backend health with retries
        import urllib.request, urllib.error
        backend_url = "http://127.0.0.1:8000"
        health_url = f"{backend_url}/health"
        deadline = time.time() + 15.0
        healthy = False
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(health_url, timeout=2) as resp:
                    if resp.status == 200:
                        healthy = True
                        break
            except Exception:
                pass
            time.sleep(0.5)
        if healthy:
            print(f"Backend healthy at {backend_url} (see {backend_url}/docs)")
        else:
            print("Backend failed health check; exiting orchestrator.")
            # Trigger cleanup in finally
            raise SystemExit(1)

        print("All services started. Press Ctrl+C to stop.")
        # Monitor child processes; log exits and stop when all have finished
        seen_exits = set()
        while True:
            time.sleep(1)
            for p in procs:
                code = p.poll()
                if code is not None and p.pid not in seen_exits:
                    print(f"Process exited (pid={p.pid}) with code {code}")
                    seen_exits.add(p.pid)
            if len(seen_exits) == len(procs):
                print("All child processes have exited. Shutting down orchestrator.")
                break
    except KeyboardInterrupt:
        print("Stopping all services...")
    finally:
        # Attempt graceful shutdown
        for p in procs:
            try:
                if p.poll() is None:
                    p.terminate()
            except Exception:
                pass
        # Give them a moment to terminate
        deadline = time.time() + 5.0
        for p in procs:
            if p.poll() is None:
                timeout = max(0.0, deadline - time.time())
                if timeout <= 0:
                    break
                try:
                    p.wait(timeout=timeout)
                except Exception:
                    pass
        # Force kill leftovers
        for p in procs:
            try:
                if p.poll() is None:
                    p.kill()
            except Exception:
                pass
        # Log final status of children
        for p in procs:
            try:
                code = p.poll()
                if code is None:
                    code = p.wait(timeout=1)
                print(f"Process final status (pid={p.pid}) exit code {code}")
            except Exception:
                print(f"Process final status (pid={p.pid}) could not be determined")

if __name__ == "__main__":
    main()