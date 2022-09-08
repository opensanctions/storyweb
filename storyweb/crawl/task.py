import logging
from xml.etree.ElementInclude import include
from lxml import html
from typing import TYPE_CHECKING, Optional
from urllib.parse import urljoin, urlparse
from aiohttp import ClientSession, ClientResponse
from aiohttp.client_exceptions import ClientConnectionError, ClientPayloadError

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
        parsed = urlparse(url)
        if parsed.scheme is None:
            return
        if parsed.scheme.lower() not in ["http", "https"]:
            return
        parsed = parsed._replace(fragment="")
        parsed = parsed._replace(netloc=parsed.netloc.lower())
        url = parsed.geturl()

        # Check url-based rules only:
        if not self.check_crawl(url, None):
            return

        task = Task(self.site, url)
        await self.site.crawler.queue.put(task)

    def check_crawl(self, url: str, page: Optional[Page]) -> bool:
        if self.site.config.include is not None:
            if not self.site.config.include.check(url, page):
                return False
        if self.site.config.exclude is not None:
            if self.site.config.exclude.check(url, page):
                return False
        return True

    async def handle_page(self, page: Page) -> None:
        if page.content is None or len(page.content) < 100:
            return
        if not self.check_crawl(self.url, page):
            return

        for link in page.doc.findall(".//a"):
            next_url = link.get("href")
            if next_url is None:
                continue
            next_url = urljoin(page.url, next_url)
            await self.enqueue(next_url)

    async def retrieve_content(self, page: Page, response: ClientResponse) -> None:
        content = b""
        try:
            while True:
                buffer = await response.content.read(MAX_CONTENT)
                if not len(buffer):
                    break
                content = content + buffer
                if len(content) >= MAX_CONTENT:
                    break
        except ClientPayloadError as payerr:
            log.warning("Did not load full page: %s", payerr)
        page.retrieved = True
        page.content = content

    async def crawl(self, http: ClientSession) -> None:
        async with engine.begin() as conn:
            cached = await Page.find(conn, self.url)
            if cached is not None:
                log.info("Cache hit: %r", cached.url)
                await self.handle_page(cached)
                return

            try:
                async with http.get(self.url) as response:
                    # print(self.site, self.url, response.status)

                    page = Page.from_response(self.url, response)
                    await self.retrieve_content(page, response)
            except ClientConnectionError as ce:
                log.error("Error [%r]: %r", self, ce)
                return

            await page.save(conn)
            await self.handle_page(page)

    def __repr__(self) -> str:
        return f"<Task({self.site!r}, {self.url!r})>"

    def __str__(self) -> str:
        return self.url
