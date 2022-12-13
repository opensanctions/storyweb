import logging
import requests
from typing import Optional
from articledata import URL

from storyweb.db import Conn
from storyweb.parse.extract import extract
from storyweb.parse.pipeline import load_one_article

log = logging.getLogger(__name__)


def import_article_by_url(conn: Conn, url: str) -> Optional[str]:
    try:
        res = requests.get(url)
        res.raise_for_status()
    except Exception as exc:
        log.exception("Cannot fetch article text: %r" % exc)
        return None

    url_obj = URL(url)
    article = extract(url_obj, res.content)
    if article is None:
        return None

    return load_one_article(conn, article)
