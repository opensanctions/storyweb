from typing import Generator, List, Optional
from fastapi import APIRouter, Depends, Path, Query
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
from storyweb.routes import links, stories, articles
from storyweb.routes.util import get_conn, get_listing
from storyweb.models import (
    Article,
    ArticleDetails,
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

router = APIRouter()


@router.get("/clusters", response_model=ListingResponse[Cluster])
def route_cluster_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    q: Optional[str] = Query(None),
    article: Optional[str] = Query(None),
    story: Optional[str] = Query(None),
    types: List[str] = Query([]),
):
    return list_clusters(
        conn,
        listing,
        query=q,
        article=article,
        story=story,
        types=types,
    )


@router.get("/clusters/{cluster}", response_model=ClusterDetails)
def route_cluster_view(conn: Conn = Depends(get_conn), cluster: str = Path()):
    obj = fetch_cluster(conn, cluster)
    if obj is None:
        raise HTTPException(404)
    return obj


@router.get(
    "/clusters/{cluster}/similar", response_model=ListingResponse[SimilarCluster]
)
def route_cluster_similar(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    cluster: str = Path(),
):
    return list_similar(conn, listing, cluster)


@router.get(
    "/clusters/{cluster}/related", response_model=ListingResponse[RelatedCluster]
)
def route_cluster_related(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    cluster: str = Path(),
    linked: Optional[bool] = Query(None),
    types: List[str] = Query([]),
):
    return list_related(
        conn,
        listing,
        cluster,
        linked=linked,
        types=types,
    )
