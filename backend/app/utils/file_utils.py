import csv
import io
from typing import Any


def rows_to_csv_bytes(rows: list[dict[str, Any]]) -> bytes:
    """Convert a list of dicts into CSV bytes (e.g. for report exports)."""
    if not rows:
        return b""
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")
