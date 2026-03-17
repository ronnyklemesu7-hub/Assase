import argparse
import csv
import os
import sqlite3
from pathlib import Path

DEFAULT_DB = "runs/data.db"
EXPORT_DIR = "runs/exports"


def export_table(conn: sqlite3.Connection, table: str, out_path: Path):
    cur = conn.cursor()
    try:
        cur.execute(f"PRAGMA table_info({table})")
        cols_meta = cur.fetchall()
        headers = [c[1] for c in cols_meta]
        if not headers:
            print(f"Skipping {table}: no columns or table does not exist")
            return
        cur.execute(f"SELECT {', '.join(headers)} FROM {table}")
        rows = cur.fetchall()
        with out_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            if rows:
                writer.writerows(rows)
        print(f"Exported {table} ({len(rows)} rows) -> {out_path}")
    except sqlite3.Error as e:
        print(f"Error exporting {table}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Export persisted data to CSV")
    parser.add_argument("--db", type=str, default=DEFAULT_DB, help="Path to SQLite DB (environment/water/distribution)")
    parser.add_argument("--out", type=str, default=EXPORT_DIR, help="Output directory for CSV files")
    parser.add_argument("--tables", type=str, default="env_frames,water_readings,distribution_daily",
                        help="Comma-separated table names to export")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not os.path.exists(args.db):
        print(f"Database {args.db} does not exist.")
        return

    conn = sqlite3.connect(args.db)
    try:
        for table in [t.strip() for t in args.tables.split(",") if t.strip()]:
            out_path = out_dir / f"{table}.csv"
            export_table(conn, table, out_path)
    finally:
        conn.close()


if __name__ == "__main__":
    main()