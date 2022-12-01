from typing import Generator, Optional
from fastapi import Query

from storyweb.db import engine, Conn
from storyweb.models import Listing


def get_conn() -> Generator[Conn, None, None]:
    """Create a database transaction for the request."""
    with engine.begin() as conn:
        yield conn


def get_listing(
    limit: int = Query(50, description="Number of objects to return", le=5000),
    offset: int = Query(0, description="Skip the first N objects in response"),
    sort: Optional[str] = Query(
        None, description="Sort criterion, format: field:direction"
    ),
) -> Listing:
    direction = "desc"
    if sort is not None and ":" in sort:
        sort, direction = sort.rsplit(":", 1)
        direction = direction.lower().strip()
        direction = "asc" if direction == "asc" else "desc"
    return Listing(
        limit=limit,
        offset=offset,
        sort_direction=direction,
        sort_field=sort,
    )
