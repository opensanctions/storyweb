from contextlib import contextmanager
from typing import Optional, Generator
from sqlalchemy import MetaData, create_engine
from sqlalchemy import Table, Column, Integer, Unicode
from sqlalchemy.engine import Engine, Connection
from sqlalchemy.dialects.postgresql import insert as upsert

from storyweb import settings

Conn = Connection

engine = create_engine(settings.DB_URL)
meta = MetaData(bind=engine)


def create_db() -> None:
    meta.create_all(checkfirst=True)


# @contextmanager
# def ensure_tx(engine: Engine, conn: Conn = None) -> Generator[Connection, None, None]:
#     if conn is not None:
#         yield conn
#         return
#     with engine.begin() as conn:
#         yield conn


ref_table = Table(
    "ref",
    meta,
    Column("id", Unicode(255), primary_key=True),
    Column("site", Unicode(255), index=True, nullable=False),
    Column("url", Unicode, nullable=True),
    Column("title", Unicode, nullable=True),
)

sentence_table = Table(
    "sentence",
    meta,
    Column("ref_id", Unicode(255), primary_key=True),
    Column("sequence", Integer, primary_key=True),
    Column("text", Unicode),
)

tag_table = Table(
    "tag",
    meta,
    Column("ref_id", Unicode(255), primary_key=True),
    Column("sentence", Integer, primary_key=True),
    Column("key", Unicode(1024), primary_key=True),
    Column("category", Unicode(255)),
    Column("text", Unicode),
)

identity_table = Table(
    "identity",
    meta,
    Column("ref_id", Unicode(255), primary_key=True),
    Column("key", Unicode(1024), nullable=True, primary_key=True),
    Column("id", Unicode(255)),
    Column("canonical_id", Unicode(255)),
)
