from typing import TYPE_CHECKING, Generator
from storyweb.config import SiteConfig
from storyweb.crawl.task import Task

if TYPE_CHECKING:
    from storyweb.crawl.crawler import Crawler


class Site(object):
    def __init__(self, crawler: "Crawler", config: SiteConfig) -> None:
        self.crawler = crawler
        self.config = config

    def seeds(self) -> Generator[Task, None, None]:
        for url in self.config.urls:
            yield Task(self, url)

    def __repr__(self) -> str:
        return f"<Site({self.config.name!r})>"

    def __str__(self) -> str:
        return self.config.name
