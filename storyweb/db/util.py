import os
from asyncio import Semaphore
from contextlib import asynccontextmanager
from typing import AsyncGenerator
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
sema = Semaphore(30)


async def create_db():
    async with engine.begin() as conn:
        # await conn.run_sync(meta.drop_all)
        await conn.run_sync(meta.create_all)


@asynccontextmanager
async def db_connect() -> AsyncGenerator[Conn, None]:
    async with sema:
        async with engine.begin() as conn:
            yield conn


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
