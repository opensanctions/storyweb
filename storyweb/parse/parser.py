import orjson
from io import BufferedWriter
from pathlib import Path
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
            locale="unknown",
            text="",
            extracted_at=page.timestamp.isoformat(),
        )
        extract: Dict[str, str] = bare_extraction(page.content, url=page.url)
        if extract is not None:
            article.title = extract.get("title", article.title)
            article.date = extract.get("date")
            article.text = extract.get("text", article.text)
            author = extract.get("author")
            if author is not None:
                article.bylines.append(author)
        return article
        # print(list(extract.keys()))

    async def run(self, outpath: Path):
        outpath.mkdir(parents=True, exist_ok=True)
        handles: Dict[str, BufferedWriter] = {}
        async with engine.begin() as conn:
            async for page in Page.iter_parse(conn):
                article = await self.parse(page)
                if article.site not in handles:
                    path = outpath.joinpath(f"{article.site}.ijson")
                    handles[article.site] = open(path, "wb")
                line = orjson.dumps(article.dict(), option=orjson.OPT_APPEND_NEWLINE)
                handles[article.site].write(line)

        for fh in handles.values():
            fh.close()
