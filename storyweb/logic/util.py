import logging
from sqlalchemy.sql import Select, Selectable, ColumnElement
from sqlalchemy.sql import func

from storyweb.db import Conn

log = logging.getLogger(__name__)


def count_stmt(conn: Conn, stmt: Select, col: Selectable | ColumnElement) -> int:
    count_stmt = stmt.with_only_columns(func.count(col))
    cursor = conn.execute(count_stmt)
    return cursor.scalar_one()
