from typing import Generator, List, Optional
from fastapi import FastAPI, Depends, Path, Query
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from storyweb.ontology import OntologyModel, ontology
from storyweb.db import engine, Conn
from storyweb.logic.articles import fetch_article, list_articles, list_sites
from storyweb.logic.clusters import (
    fetch_cluster,
    list_clusters,
    list_related,
    list_similar,
    merge_cluster,
    explode_cluster,
    untag_article,
)
from storyweb.logic.links import (
    create_link,
    list_links,
    untag_article,
)
from storyweb.logic.stories import (
    list_stories,
    fetch_story,
    create_story,
    toggle_story_article,
)
from storyweb.routes import links
from storyweb.routes.util import get_conn, get_listing
from storyweb.models import (
    Article,
    ArticleDetails,
    StoryCreate,
    StoryArticleToggle,
    Story,
    Cluster,
    ClusterDetails,
    Link,
    LinkBase,
    Listing,
    ListingResponse,
    MergeRequest,
    ExplodeRequest,
    UntagRequest,
    RelatedCluster,
    SimilarCluster,
    Site,
)

app = FastAPI(
    title="storyweb",
    description="make networks from text",
    redoc_url="/",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(links.router)


@app.get("/sites", response_model=ListingResponse[Site])
def sites_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
):
    """List all the source sites from which articles (refs) have been imported."""
    return list_sites(conn, listing)


@app.get("/articles", response_model=ListingResponse[Article])
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


@app.get("/articles/{article_id}", response_model=ArticleDetails)
def article_view(
    conn: Conn = Depends(get_conn),
    article_id: str = Path(),
):
    article = fetch_article(conn, article_id)
    if article is None:
        raise HTTPException(404)
    return article


@app.get("/stories", response_model=ListingResponse[Story])
def story_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    q: Optional[str] = Query(None),
    article: Optional[str] = Query(None),
):
    return list_stories(conn, listing, query=q, article=article)


@app.post("/stories", response_model=Story)
def story_create(story: StoryCreate, conn: Conn = Depends(get_conn)):
    return create_story(conn, story)


@app.get("/stories/{story_id}", response_model=Story)
def story_view(
    conn: Conn = Depends(get_conn),
    story_id: str = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    return story


@app.post("/stories/{story_id}/articles", response_model=Story)
def story_article_toggle(
    data: StoryArticleToggle,
    conn: Conn = Depends(get_conn),
    story_id: str = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
    toggle_story_article(conn, story_id, data.article)
    return story


@app.get("/clusters", response_model=ListingResponse[Cluster])
def route_cluster_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    q: Optional[str] = Query(None),
    article: Optional[str] = Query(None),
):
    return list_clusters(conn, listing, query=q, article=article)


@app.get("/clusters/{cluster}", response_model=ClusterDetails)
def route_cluster_view(conn: Conn = Depends(get_conn), cluster: str = Path()):
    obj = fetch_cluster(conn, cluster)
    if obj is None:
        raise HTTPException(404)
    return obj


@app.get("/clusters/{cluster}/similar", response_model=ListingResponse[SimilarCluster])
def route_cluster_similar(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    cluster: str = Path(),
):
    return list_similar(conn, listing, cluster)


@app.get("/clusters/{cluster}/related", response_model=ListingResponse[RelatedCluster])
def route_cluster_related(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    cluster: str = Path(),
    linked: Optional[bool] = Query(None),
):
    return list_related(conn, listing, cluster, linked=linked)


@app.get("/ontology", response_model=OntologyModel)
def ontology_model() -> OntologyModel:
    return ontology.model
