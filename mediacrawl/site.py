import random
import asyncio
from asyncio import Semaphore
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING, AsyncGenerator, Dict, Generator

from mediacrawl.config import SiteConfig
from mediacrawl.task import Task
from mediacrawl.url import URL

if TYPE_CHECKING:
    from mediacrawl.crawler import Crawler


class Site(object):
    def __init__(self, crawler: "Crawler", config: SiteConfig) -> None:
        self.crawler = crawler
        self.config = config
        self.semaphores: Dict[str, Semaphore] = {}

    def seeds(self) -> Generator[Task, None, None]:
        for url in self.config.urls:
            yield Task(self, url)

    def is_delay_locked(self, url: URL) -> bool:
        if url.domain in self.semaphores:
            return self.semaphores[url.domain].locked()
        return False

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
