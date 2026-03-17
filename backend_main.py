import argparse
import uvicorn


def main():
    parser = argparse.ArgumentParser(description="Backend API Server")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload (dev only)")
    args = parser.parse_args()

    uvicorn.run("src.backend.server:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()