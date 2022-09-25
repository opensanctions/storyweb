import orjson
import logging
import langdetect
import languagecodes
from pathlib import Path
from io import BufferedWriter
from charset_normalizer import from_bytes
from typing import Dict, List, Optional
from articledata import Article
from trafilatura import bare_extraction

from mediacrawl.config import SiteConfig
from mediacrawl.page import Page
from mediacrawl.db import engine

logging.getLogger("trafilatura").setLevel(logging.WARNING)
log = logging.getLogger(__name__)


class Parser(object):
    def __init__(self, config: SiteConfig):
        self.config = config

    def page_text(self, page: Page) -> Optional[str]:
        if page.content is None:
            return None
        if len(page.content) < 100:
            return None
        if page.content.startswith(b"%PDF-"):
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
            id=page.url.id(),
            url=page.url.url,
            title=page.url.url,
            site=page.site,
            bylines=[],
            language="xxx",
            locale="xx",
            text="",
            extracted_at=page.timestamp.isoformat(),
        )
        text = self.page_text(page)
        if text is None:
            return None

        extract: Dict[str, str] = bare_extraction(
            text, url=page.url.url, include_comments=False
        )
        if extract is not None:
            article.title = extract.get("title", article.title)
            article.date = extract.get("date")
            article.text = extract.get("text", article.text)
            author = extract.get("author")
            if author is not None:
                article.bylines.append(author)

        lang = langdetect.detect(text)
        if lang is not None:
            article.locale = lang
            lang_long = languagecodes.iso_639_alpha3(lang)
            if lang_long is not None:
                article.language = lang_long

        return article

    async def run(self, outpath: Path, sites: List[str]):
        outpath.mkdir(parents=True, exist_ok=True)
        handles: Dict[str, BufferedWriter] = {}
        async with engine.begin() as conn:
            async for page in Page.iter_parse(conn):
                if len(sites) and page.site not in sites:
                    continue
                article = await self.parse(page)
                if article is None:
                    continue
                if article.site not in handles:
                    path = outpath.joinpath(f"{article.site}.ijson")
                    handles[article.site] = open(path, "wb")
                line = orjson.dumps(article.dict(), option=orjson.OPT_APPEND_NEWLINE)
                handles[article.site].write(line)

        for fh in handles.values():
            fh.close()
