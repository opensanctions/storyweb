import random
import asyncio
from asyncio import Semaphore
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING, AsyncGenerator, Dict, Generator
from urllib.parse import urlparse
from storyweb.config import SiteConfig
from storyweb.crawl.task import Task
from storyweb.crawl.url import URL

if TYPE_CHECKING:
    from storyweb.crawl.crawler import Crawler


class Site(object):
    def __init__(self, crawler: "Crawler", config: SiteConfig) -> None:
        self.crawler = crawler
        self.config = config
        self.semaphores: Dict[str, Semaphore] = {}

    def seeds(self) -> Generator[Task, None, None]:
        for url in self.config.urls:
            yield Task(self, url)

    # def check_delay(self, url) ->

    @asynccontextmanager
    async def delay_url(self, url: URL) -> AsyncGenerator[URL, None]:
        if url.domain not in self.semaphores:
            self.semaphores[url.domain] = Semaphore(self.config.domain_concurrency)
        async with self.semaphores[url.domain]:
            delay = self.config.delay * 0.8
            wait = delay * ((self.config.delay * 0.4) * random.random())
            await asyncio.sleep(wait)
            yield url

    def __repr__(self) -> str:
        return f"<Site({self.config.name!r})>"

    def __str__(self) -> str:
        return self.config.name
