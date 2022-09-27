import os
from pathlib import Path

DB_URL = os.environ.get("STORYWEB_DB_URL")
if DB_URL is None:
    raise RuntimeError("No $STORYWEB_DB_URL is configured!")
