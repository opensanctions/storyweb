import logging
import orjson
from charset_normalizer import from_bytes
from io import BufferedWriter
from pathlib import Path
from typing import Dict, Optional, Union
from articledata import Article
from trafilatura import bare_extraction

from storyweb.config import SiteConfig
from storyweb.db.page import Page
from storyweb.db.util import engine

logging.getLogger("trafilatura").setLevel(logging.WARNING)
log = logging.getLogger(__name__)


class Parser(object):
    def __init__(self, config: SiteConfig):
        self.config = config

    def page_text(self, page: Page) -> Optional[str]:
        if page.content is None:
            return None
        if page.charset is not None:
            try:
                return page.content.decode(page.charset)
            except UnicodeDecodeError:
                pass
        res = from_bytes(page.content)
        match = res.best()
        if match is not None and match.encoding is not None:
            try:
                return page.content.decode(match.encoding)
            except UnicodeDecodeError:
                pass
        return page.content.decode("utf-8", errors="ignore")

    async def parse(self, page: Page) -> Optional[Article]:
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
        text = self.page_text(page)
        if text is None:
            return None

        if len(text) < 100 or text.startswith("%PDF-"):
            return None

        extract: Dict[str, str] = bare_extraction(
            text, url=page.url, include_comments=False
        )
        if extract is not None:
            article.title = extract.get("title", article.title)
            article.date = extract.get("date")
            article.text = extract.get("text", article.text)
            author = extract.get("author")
            if author is not None:
                article.bylines.append(author)

        # reliable, _, details = cld2.detect(article.text)
        # print(article.url, reliable, details)
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
