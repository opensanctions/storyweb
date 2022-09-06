from typing import TYPE_CHECKING, Generator
from storyweb.crawl.config import SiteConfig
from storyweb.crawl.page import Page

if TYPE_CHECKING:
    from storyweb.crawl.crawler import Crawler


class Site(object):
    def __init__(self, crawler: "Crawler", config: SiteConfig) -> None:
        self.crawler = crawler
        self.config = config

    def seeds(self) -> Generator[Page, None, None]:
        for url in self.config.urls:
            yield Page(self, url)

    def __repr__(self) -> str:
        return f"<Site({self.config.name!r})>"

    def __str__(self) -> str:
        return self.config.name
