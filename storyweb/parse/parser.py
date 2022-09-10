from typing import Dict
from articledata import Article
from trafilatura import bare_extraction

from storyweb.config import SiteConfig
from storyweb.db.page import Page
from storyweb.db.util import engine


class Parser(object):
    def __init__(self, config: SiteConfig):
        self.config = config

    async def parse(self, page: Page) -> Article:
        article = Article(
            id=page.url,
            url=page.url,
            title=page.url,
            site=page.site,
            bylines=[],
            language="unk",
            locale="xx-XX",
            text="",
            extracted_at=page.timestamp.isoformat(),
        )
        extract: Dict[str, str] = bare_extraction(page.content, url=page.url)
        article.title = extract.get("title")
        article.date = extract.get("date")
        article.text = extract.get("text")
        author = extract.get("author")
        if author is not None:
            article.bylines.append(author)
        return article
        # print(list(extract.keys()))

    async def run(self):
        async with engine.begin() as conn:
            async for page in Page.iter_parse(conn):
                article = await self.parse(page)
                # print(page.url, page.doc)
                # print(article.url, article.title)
                print(article.bylines, article.title)
