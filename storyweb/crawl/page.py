from datetime import datetime
from operator import or_
from typing import Optional
from pydantic import BaseModel
from aiohttp import ClientResponse
from sqlalchemy import or_
from sqlalchemy.future import select

from storyweb.db.util import Conn, page_table, upsert

MAX_CONTENT: int = 1024 * 1024 * 20


class Page(BaseModel):
    url: str
    original_url: str
    method: str = "GET"
    ok: bool = False
    status: Optional[int] = None
    timestamp: datetime
    # headers: Optional[str] = None
    content_type: Optional[str] = None
    charset: Optional[str] = None
    content: Optional[bytes] = None

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def from_response(cls, original_url: str, resp: ClientResponse) -> "Page":
        # resp.headers.it
        return cls(
            url=str(resp.url),
            original_url=original_url,
            method=resp.method,
            ok=resp.ok,
            status=resp.status,
            # headers=CIMultiDict(resp.headers.items()),
            content_type=resp.content_type,
            charset=resp.charset,
            timestamp=datetime.utcnow(),
        )

    @classmethod
    async def find(cls, url: str, conn: Conn) -> Optional["Page"]:
        stmt = select(page_table)
        clause = or_(
            page_table.c.url == url,
            page_table.c.original_url == url,
        )
        stmt = stmt.where(clause)
        resp = await conn.execute(stmt)
        row = resp.fetchone()
        if row is None:
            return None
        return cls.parse_obj(row)

    async def save(self, conn: Conn) -> None:
        istmt = upsert(page_table).values([self.dict()])
        values = dict(
            ok=istmt.excluded.ok,
            status=istmt.excluded.status,
            content_type=istmt.excluded.content_type,
            charset=istmt.excluded.charset,
            content=istmt.excluded.content,
            timestamp=istmt.excluded.timestamp,
        )
        stmt = istmt.on_conflict_do_update(index_elements=["url"], set_=values)
        await conn.execute(stmt)
