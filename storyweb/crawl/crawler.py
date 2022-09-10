import asyncio
import logging
from asyncio import Queue
from asyncio import Task as AsyncTask
from typing import List, Set
from aiohttp import ClientSession
from storyweb.config import CrawlConfig
from storyweb.crawl.site import Site
from storyweb.crawl.task import Task

log = logging.getLogger(__name__)


class Crawler(object):
    def __init__(self, config: CrawlConfig) -> None:
        self.config = config
        self.sites = [Site(self, c) for c in config.sites]
        self.queue = Queue[Task]()
        self.seen: Set[str] = set()

    async def worker(self, session: ClientSession):
        try:
            while True:
                page = await self.queue.get()

                # TODO: use hashes?
                if page.url in self.seen:
                    continue
                self.seen.add(page.url)

                try:
                    await page.crawl(session)
                except Exception:
                    log.exception("Failed to crawl page: %r" % page)
                self.queue.task_done()
        except KeyboardInterrupt:
            pass

    async def run(self):
        for site in self.sites:
            for page in site.seeds():
                await self.queue.put(page)

        headers = {"User-Agent": self.config.user_agent}
        async with ClientSession(headers=headers) as session:
            tasks: List[asyncio.Task[None]] = []
            for _ in range(self.config.concurrency):
                task = asyncio.create_task(self.worker(session))
                tasks.append(task)

            await self.queue.join()
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
