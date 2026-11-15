"""Add NSL-KDD column headers to the dataset CSV files in this folder.

The NSL-KDD files ship without a header row. This script prepends one header
line to ``KDDTrain+.csv`` and ``KDDTest+.csv`` in ``dataset/``.

Safety guarantees:
- Works on raw bytes: data rows, values, delimiters and the original line
  terminator (CR-only in this copy) are preserved exactly.
- Idempotent: a file whose first line is already the header is left untouched,
  so running the script many times never adds duplicate headers.
- Validates that every data row has the expected number of fields before
  writing, and verifies afterwards that the data body is byte-identical.
- ``dataset/raw/`` is never modified (it is the pristine source copy).

Usage:
    python dataset/add_headers.py            # update the default files
    python dataset/add_headers.py FILE ...   # update specific files
"""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

# 42-column NSL-KDD schema (41 features + ``class``), followed by the
# ``difficulty_level`` column that is physically present as column 43 in the
# KDDTrain+/KDDTest+ files.
COLUMNS = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes",
    "land", "wrong_fragment", "urgent", "hot", "num_failed_logins", "logged_in",
    "num_compromised", "root_shell", "su_attempted", "num_root",
    "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds",
    "is_host_login", "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
    "diff_srv_rate", "srv_diff_host_rate", "dst_host_count",
    "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate", "dst_host_srv_serror_rate", "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate", "class", "difficulty_level",
]
HEADER = ",".join(COLUMNS).encode("ascii")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_ROOT / "dataset"
DEFAULT_FILES = [DATASET_DIR / "KDDTrain+.csv", DATASET_DIR / "KDDTest+.csv"]


def detect_terminator(data: bytes) -> bytes:
    """Return the line terminator used in ``data`` (CRLF, LF or CR)."""
    if b"\r\n" in data:
        return b"\r\n"
    if b"\n" in data:
        return b"\n"
    if b"\r" in data:
        return b"\r"
    raise ValueError("No line terminator found; file is not a multi-line CSV.")


def has_header(data: bytes) -> bool:
    """True when the first line of ``data`` is exactly the expected header."""
    first = data.split(detect_terminator(data), 1)[0]
    return first == HEADER


def validate_rows(data: bytes, terminator: bytes) -> int:
    """Check every non-empty row has ``len(COLUMNS)`` fields; return row count."""
    rows = [r for r in data.split(terminator) if r]
    bad = [i for i, r in enumerate(rows) if r.count(b",") != len(COLUMNS) - 1]
    if bad:
        raise ValueError(
            f"{len(bad)} rows do not have {len(COLUMNS)} fields (first bad row index: {bad[0]})."
        )
    return len(rows)


def add_header(path: Path) -> str:
    """Prepend the header to ``path`` if missing. Returns a status message."""
    path = Path(path)
    if "raw" in path.resolve().parent.parts[-1:]:
        raise ValueError(f"Refusing to modify pristine raw file: {path}")

    data = path.read_bytes()
    if has_header(data):
        return f"skip   {path.name}: header already present"

    terminator = detect_terminator(data)
    n_rows = validate_rows(data, terminator)
    body_hash = hashlib.sha256(data).hexdigest()

    new_data = HEADER + terminator + data
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(new_data)

    # Verify: header is first line and the remaining bytes equal the original.
    written = tmp.read_bytes()
    body = written[len(HEADER) + len(terminator):]
    if hashlib.sha256(body).hexdigest() != body_hash:
        tmp.unlink()
        raise RuntimeError(f"Body hash mismatch for {path}; original left unchanged.")
    tmp.replace(path)
    return f"update {path.name}: header added ({n_rows} data rows, terminator={terminator!r})"


def main(argv: list[str]) -> int:
    files = [Path(a) for a in argv] or DEFAULT_FILES
    for f in files:
        print(add_header(f))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
