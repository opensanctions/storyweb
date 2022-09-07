import logging
from lxml import html
from typing import TYPE_CHECKING
from urllib.parse import urljoin, urlparse
from aiohttp import ClientSession
from aiohttp.client_exceptions import ClientConnectionError

from storyweb.crawl.page import Page, MAX_CONTENT
from storyweb.db.util import engine

if TYPE_CHECKING:
    from storyweb.crawl.site import Site

log = logging.getLogger(__name__)


class Task(object):
    def __init__(self, site: "Site", url: str) -> None:
        self.site = site
        self.url = url

    async def enqueue(self, url: str) -> None:
        task = Task(self.site, url)
        await self.site.crawler.queue.put(task)

    async def handle_page(self, page: Page) -> None:
        if len(page.content) < 100:
            return
        doc = html.document_fromstring(page.content, base_url=page.url)
        for link in doc.findall(".//a"):
            next_url = link.get("href")
            if next_url is None:
                continue
            next_url = urljoin(page.url, next_url)
            parsed = urlparse(next_url)
            if parsed.scheme.lower() not in ["http", "https"]:
                continue
            await self.enqueue(next_url)

    async def crawl(self, http: ClientSession) -> None:
        async with engine.begin() as conn:
            cached = await Page.find(self.url, conn)
            if cached is not None:
                await self.handle_page(cached)
                return

            try:
                async with http.get(self.url) as response:
                    print(self.site, self.url, response.status)

                    page = Page.from_response(self.url, response)

                    content = b""
                    while True:
                        buffer = await response.content.read(MAX_CONTENT)
                        if not len(buffer):
                            break
                        content = content + buffer
                        if len(content) >= MAX_CONTENT:
                            break

                    page.content = content
            except ClientConnectionError as ce:
                log.error("Error [%r]: %r", self, ce)
                return

            await page.save(conn)
            await self.handle_page(page)

    def __repr__(self) -> str:
        return f"<Task({self.site!r}, {self.url!r})>"

    def __str__(self) -> str:
        return self.url
