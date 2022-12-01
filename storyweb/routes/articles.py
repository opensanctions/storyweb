from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query
from fastapi.exceptions import HTTPException

from storyweb.db import Conn
from storyweb.logic.articles import fetch_article, list_articles, list_sites
from storyweb.routes.util import get_conn, get_listing
from storyweb.models import (
    Article,
    ArticleDetails,
    Listing,
    ListingResponse,
    Site,
)

router = APIRouter()


@router.get("/sites", response_model=ListingResponse[Site])
def sites_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
):
    """List all the source sites from which articles (refs) have been imported."""
    return list_sites(conn, listing)


@router.get("/articles", response_model=ListingResponse[Article])
def articles_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    site: Optional[str] = Query(None),
    story: Optional[int] = Query(None),
    q: Optional[str] = Query(None),
    cluster: List[str] = Query([]),
):
    clusters = [i for i in cluster if i is not None and len(i.strip())]
    return list_articles(
        conn,
        listing,
        site=site,
        story=story,
        query=q,
        clusters=clusters,
    )


@router.get("/articles/{article_id}", response_model=ArticleDetails)
def article_view(
    conn: Conn = Depends(get_conn),
    article_id: str = Path(),
):
    article = fetch_article(conn, article_id)
    if article is None:
        raise HTTPException(404)
    return article
