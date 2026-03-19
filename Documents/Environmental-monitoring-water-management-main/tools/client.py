import argparse
import json
from urllib.parse import urljoin

import urllib.request


def fetch(url: str):
    with urllib.request.urlopen(url) as resp:
        data = resp.read()
        try:
            return json.loads(data.decode("utf-8"))
        except Exception:
            return {"raw": data.decode("utf-8", errors="ignore")}


def main():
    parser = argparse.ArgumentParser(description="Simple CLI client for backend API")
    parser.add_argument("--base", type=str, default="http://localhost:8000/", help="Base URL of backend (with trailing slash preferred)")
    parser.add_argument("--endpoint", type=str, default="health",
                        help="Endpoint to query: health|env/summary|energy/stats|water/recent|distribution/summary")
    args = parser.parse_args()

    path = args.endpoint.lstrip("/")
    url = urljoin(args.base if args.base.endswith("/") else args.base + "/", path)
    print(f"GET {url}")
    out = fetch(url)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()