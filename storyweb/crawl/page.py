from urllib.parse import urljoin
from lxml import html
from typing import TYPE_CHECKING
from aiohttp import ClientSession

if TYPE_CHECKING:
    from storyweb.crawl.site import Site


class Page(object):
    def __init__(self, site: "Site", url: str) -> None:
        self.site = site
        self.url = url

    async def enqueue(self, url: str) -> None:
        page = Page(self.site, url)
        await self.site.crawler.queue.put(page)

    async def crawl(self, http: ClientSession) -> None:
        async with http.get(self.url) as response:
            print(self.site, self.url, response.status)

            text = await response.read()
            doc = html.fromstring(text)
            # article = trafilatura.bare_extraction(doc)
            # print(article)
            for link in doc.findall(".//a"):
                next_url = link.get("href")
                if next_url is None:
                    continue
                next_url = urljoin(self.url, next_url)
                await self.enqueue(next_url)
