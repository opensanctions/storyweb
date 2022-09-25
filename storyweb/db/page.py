from datetime import datetime
from functools import cached_property
from operator import or_
from typing import AsyncGenerator, Optional
from pydantic import BaseModel, validator
from aiohttp import ClientResponse
from lxml import html
from sqlalchemy import or_
from sqlalchemy import update
from sqlalchemy.future import select
from storyweb.crawl.url import URL

from storyweb.db.util import Conn, page_table, upsert


class Page(BaseModel):
    site: str
    url: URL
    original_url: URL
    method: str = "GET"
    ok: bool = False
    parse: bool = False
    retrieved: bool = False
    status: Optional[int] = None
    timestamp: datetime
    # headers: Optional[str] = None
    content_type: Optional[str] = None
    charset: Optional[str] = None
    content: Optional[bytes] = None

    @cached_property
    def doc(self):
        return html.document_fromstring(self.content, base_url=self.url.url)

    @validator("url", "original_url")
    def convert_url(cls, url: Optional[str]) -> Optional[URL]:
        if url is None:
            return None
        return URL(url)

    class Config:
        keep_untouched = (cached_property,)

    @classmethod
    def from_response(
        cls, site: str, original_url: URL, resp: ClientResponse
    ) -> "Page":
        return cls(
            site=site,
            url=URL(str(resp.url)),
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
    async def find(cls, conn: Conn, url: URL) -> Optional["Page"]:
        stmt = select(page_table)
        clause = or_(
            page_table.c.url == url.url,
            page_table.c.original_url == url.url,
        )
        stmt = stmt.where(clause)
        stmt = stmt.limit(1)
        resp = await conn.execute(stmt)
        for row in resp.fetchall():
            page = cls.parse_obj(row)
            page.retrieved = True
            return page
        return None

    @classmethod
    async def iter_parse(cls, conn: Conn) -> AsyncGenerator["Page", None]:
        stmt = select(page_table)
        stmt = stmt.where(page_table.c.parse == True)
        result = await conn.stream(stmt)
        async for row in result:
            page = cls.parse_obj(row)
            page.retrieved = True
            yield page

    async def save(self, conn: Conn) -> None:
        data = self.dict(exclude={"retrieved", "doc", "url", "original_url"})
        data["url"] = self.url.url
        data["original_url"] = self.original_url.url
        istmt = upsert(page_table).values([data])
        values = dict(
            ok=istmt.excluded.ok,
            parse=istmt.excluded.ok,
            status=istmt.excluded.status,
            content_type=istmt.excluded.content_type,
            charset=istmt.excluded.charset,
            content=istmt.excluded.content,
            timestamp=istmt.excluded.timestamp,
        )
        stmt = istmt.on_conflict_do_update(index_elements=["url"], set_=values)
        await conn.execute(stmt)

    async def update_parse(self, conn: Conn) -> None:
        stmt = update(page_table)
        stmt = stmt.where(page_table.c.url == self.url.url)
        stmt = stmt.values({"parse": self.parse})
        await conn.execute(stmt)
