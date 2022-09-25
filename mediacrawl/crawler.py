import asyncio
import logging
from asyncio import Queue
from typing import List, Set
from aiohttp import ClientSession, TCPConnector
from aiohttp.client import ClientTimeout
from mediacrawl.config import CrawlConfig
from mediacrawl.site import Site
from mediacrawl.task import Task
from mediacrawl.url import URL

log = logging.getLogger(__name__)


class Crawler(object):
    def __init__(self, config: CrawlConfig) -> None:
        self.config = config
        self.sites = [Site(self, c) for c in config.sites]
        self.queue = Queue[Task]()
        self.seen: Set[URL] = set()

    async def worker(self, session: ClientSession):
        try:
            while True:
                page = await self.queue.get()

                # TODO: use hashes?
                if page.url in self.seen:
                    self.queue.task_done()
                    continue
                self.seen.add(page.url)

                try:
                    await page.crawl(session)
                except Exception:
                    log.exception("Failed to crawl page: %r" % page)
                self.queue.task_done()
        except KeyboardInterrupt:
            pass

    async def run(self, sites: List[str]):
        for site in self.sites:
            if len(sites) and site.config.name not in sites:
                continue
            for page in site.seeds():
                await self.queue.put(page)

        headers = {"User-Agent": self.config.user_agent}
        timeout = ClientTimeout(10)
        connector = TCPConnector(limit_per_host=5)
        async with ClientSession(
            headers=headers, timeout=timeout, connector=connector
        ) as session:
            tasks: List[asyncio.Task[None]] = []
            for _ in range(self.config.concurrency):
                task = asyncio.create_task(self.worker(session))
                tasks.append(task)

            await self.queue.join()
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
