import logging
from datetime import datetime
from typing import Optional, Dict, Any
from articledata import URL, Article
from trafilatura import bare_extraction

from storyweb.parse.language import detect_language

log = logging.getLogger(__name__)


def extract(url: URL, html: Any) -> Optional[Article]:
    log.info("Parsing: %r", url)
    article = Article(
        id=url.id,
        url=url.url,
        title=url.url,
        site=url.domain,
        bylines=[],
        language="xxx",
        locale="xx",
        text="",
        extracted_at=datetime.utcnow().isoformat(),
    )

    extract: Dict[str, str] = bare_extraction(html, url=url.url, include_comments=False)
    if extract is not None:
        article.title = extract.get("title", article.title)
        article.date = extract.get("date")
        article.text = extract.get("text", article.text)
        author = extract.get("author")
        if author is not None:
            article.bylines.append(author)

    lang = detect_language(article.text)
    if lang is not None:
        article.language = lang
    return article
