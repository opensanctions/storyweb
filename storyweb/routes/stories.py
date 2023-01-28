from normality import slugify
from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Query
from fastapi.responses import PlainTextResponse
from fastapi.exceptions import HTTPException

from storyweb.db import Conn
from storyweb.logic.stories import (
    list_stories,
    fetch_story,
    create_story,
    update_story,
    delete_story,
    toggle_story_article,
)
from storyweb.logic.clusters import list_story_pairs
from storyweb.logic.graph import generate_graph_gexf, generate_graph_ftm
from storyweb.logic.links import story_merge
from storyweb.parse import import_article_by_url
from storyweb.routes.util import get_conn, get_listing
from storyweb.models import (
    StoryMutation,
    StoryArticleToggle,
    StoryArticleImportUrl,
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
def story_create(story: StoryMutation, conn: Conn = Depends(get_conn)):
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


@router.post("/stories/{story_id}/articles/import-url", response_model=Story)
def story_article_import_url(
    data: StoryArticleImportUrl,
    conn: Conn = Depends(get_conn),
    story_id: int = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    article_id = import_article_by_url(conn, data.url)
    if article_id is None:
        raise HTTPException(400)
    story_merge(conn, story_id, article_id)
    toggle_story_article(conn, story_id, article_id, delete_existing=False)
    return story


@router.get("/stories/{story_id}/pairs", response_model=ListingResponse[ClusterPair])
def story_pairs(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    story_id: int = Path(),
    linked: Optional[bool] = Query(None),
    types: List[str] = Query([]),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    return list_story_pairs(conn, listing, story_id, linked=linked, types=types)


@router.get("/stories/{story_id}/gexf", response_class=PlainTextResponse)
def story_gexf(
    conn: Conn = Depends(get_conn),
    story_id: int = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    filename = slugify(story.title, sep="_")
    text = generate_graph_gexf(conn, story=story_id)
    return PlainTextResponse(
        content=text,
        media_type="text/xml",
        headers={"Content-Disposition": f"attachment; filename={filename}.gexf"},
    )


@router.get("/stories/{story_id}/ftm", response_class=PlainTextResponse)
def story_ftm(
    conn: Conn = Depends(get_conn),
    story_id: int = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    filename = slugify(story.title, sep="_")
    text = generate_graph_ftm(conn, story_id=story_id)
    return PlainTextResponse(
        content=text,
        media_type="application/json+ftm",
        headers={"Content-Disposition": f"attachment; filename={filename}.ftm.json"},
    )


@router.post("/stories/{story_id}", response_model=Story)
def story_update(
    data: StoryMutation, conn: Conn = Depends(get_conn), story_id: int = Path()
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    return update_story(conn, data, story_id)


@router.delete("/stories/{story_id}")
def story_delete(
    conn: Conn = Depends(get_conn),
    story_id: int = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    delete_story(conn, story_id)
    return None
