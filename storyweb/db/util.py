import os
from contextlib import contextmanager
from sqlalchemy import MetaData
from sqlalchemy.types import JSON
from sqlalchemy import Table, Column, Integer, DateTime, Unicode, Boolean, LargeBinary
from sqlalchemy.dialects.postgresql import insert as upsert

from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection


KEY_LEN = 255
VALUE_LEN = 65535
Conn = AsyncConnection

# __all__ = ["Conn", "engine_tx", "create_db", "upsert"]

db_uri = os.environ.get("STORYWEB_DATABASE_URL", "sqlite+aiosqlite:///storyweb.db")
engine = create_async_engine(db_uri)
meta = MetaData()


async def create_db():
    async with engine.begin() as conn:
        # await conn.run_sync(meta.drop_all)
        await conn.run_sync(meta.create_all)


# @contextmanager
# def engine_tx():
#     with engine.begin() as conn:
#         yield conn


# @contextmanager
# def engine_read():
#     with engine.connect() as conn:
#         yield conn


page_table = Table(
    "page",
    meta,
    Column("site", Unicode(1024)),
    Column("url", Unicode(8192), primary_key=True),
    Column("original_url", Unicode(8192), index=True),
    Column("method", Unicode(16)),
    Column("ok", Boolean),
    Column("parse", Boolean),
    Column("status", Integer),
    Column("timestamp", DateTime, nullable=False),
    Column("headers", Unicode()),
    Column("content_type", Unicode(1024)),
    Column("charset", Unicode(1024)),
    Column("content", LargeBinary, nullable=True),
)

# resource_table = Table(
#     "resource",
#     metadata,
#     Column("path", Unicode(KEY_LEN), primary_key=True, nullable=False),
#     Column("dataset", Unicode(KEY_LEN), primary_key=True, index=True, nullable=False),
#     Column("checksum", Unicode(KEY_LEN), nullable=False),
#     Column("timestamp", DateTime, nullable=False),
#     Column("mime_type", Unicode(KEY_LEN), nullable=True),
#     Column("size", Integer, nullable=True),
#     Column("title", Unicode(VALUE_LEN), nullable=True),
# )

# stmt_table = Table(
#     "statement",
#     metadata,
#     Column("id", Unicode(KEY_LEN), primary_key=True, unique=True),
#     Column("entity_id", Unicode(KEY_LEN), index=True, nullable=False),
#     Column("canonical_id", Unicode(KEY_LEN), index=True, nullable=True),
#     Column("prop", Unicode(KEY_LEN), nullable=False),
#     Column("prop_type", Unicode(KEY_LEN), nullable=False),
#     Column("schema", Unicode(KEY_LEN), nullable=False),
#     Column("value", Unicode(VALUE_LEN), nullable=False),
#     Column("dataset", Unicode(KEY_LEN), index=True),
#     Column("target", Boolean, default=False, nullable=False),
#     Column("external", Boolean, default=False, nullable=False),
#     Column("first_seen", DateTime, nullable=False),
#     Column("last_seen", DateTime, index=True),
# )

# canonical_table = Table(
#     "canonical",
#     metadata,
#     Column("entity_id", Unicode(KEY_LEN), index=True, nullable=False),
#     Column("canonical_id", Unicode(KEY_LEN), index=False, nullable=True),
# )


# analytics_entity_table = Table(
#     "analytics_entity",
#     metadata,
#     Column("id", Unicode(KEY_LEN), index=True, nullable=False),
#     Column("schema", Unicode(KEY_LEN), nullable=False),
#     Column("caption", Unicode(VALUE_LEN), nullable=False),
#     Column("target", Boolean),
#     Column("properties", JSONB),
#     Column("first_seen", DateTime),
#     Column("last_seen", DateTime),
# )

# analytics_dataset_table = Table(
#     "analytics_dataset",
#     metadata,
#     Column("entity_id", Unicode(KEY_LEN), index=True, nullable=False),
#     Column("dataset", Unicode(KEY_LEN), index=True, nullable=False),
# )

# analytics_country_table = Table(
#     "analytics_country",
#     metadata,
#     Column("entity_id", Unicode(KEY_LEN), index=True, nullable=False),
#     Column("country", Unicode(KEY_LEN), index=True, nullable=False),
# )
