from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query
from fastapi.responses import PlainTextResponse
from fastapi.exceptions import HTTPException

from storyweb.db import Conn
from storyweb.logic.stories import (
    list_stories,
    fetch_story,
    create_story,
    toggle_story_article,
)
from storyweb.logic.clusters import list_story_pairs
from storyweb.logic.graph import generate_graph_gexf
from storyweb.routes.util import get_conn, get_listing
from storyweb.models import (
    StoryCreate,
    StoryArticleToggle,
    Story,
    ClusterPair,
    Listing,
    ListingResponse,
)

router = APIRouter()


@router.get("/stories", response_model=ListingResponse[Story])
def story_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    q: Optional[str] = Query(None),
    article: Optional[str] = Query(None),
):
    return list_stories(conn, listing, query=q, article=article)


@router.post("/stories", response_model=Story)
def story_create(story: StoryCreate, conn: Conn = Depends(get_conn)):
    return create_story(conn, story)


@router.get("/stories/{story_id}", response_model=Story)
def story_view(
    conn: Conn = Depends(get_conn),
    story_id: int = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    return story


@router.post("/stories/{story_id}/articles", response_model=Story)
def story_article_toggle(
    data: StoryArticleToggle,
    conn: Conn = Depends(get_conn),
    story_id: int = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    toggle_story_article(conn, story_id, data.article)
    return story


@router.get("/stories/{story_id}/pairs", response_model=ListingResponse[ClusterPair])
def story_pairs(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    story_id: int = Path(),
    linked: Optional[bool] = Query(None),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    return list_story_pairs(conn, listing, story_id, linked=linked)


@router.get("/stories/{story_id}/gexf", response_class=PlainTextResponse)
def story_gexf(
    conn: Conn = Depends(get_conn),
    story_id: int = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    text = generate_graph_gexf(conn, story=story_id)
    return PlainTextResponse(content=text, media_type="text/xml")
