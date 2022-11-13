from typing import Generator, List, Optional
from fastapi import FastAPI, Depends, Path, Query
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from storyweb.ontology import OntologyModel, ontology
from storyweb.db import engine, Conn
from storyweb.logic import (
    create_link,
    fetch_article,
    fetch_cluster,
    fetch_story,
    list_articles,
    list_stories,
    list_clusters,
    list_links,
    list_related,
    list_similar,
    list_sites,
    merge_cluster,
    explode_cluster,
)
from storyweb.models import (
    Article,
    ArticleDetails,
    Story,
    Cluster,
    ClusterDetails,
    Link,
    LinkBase,
    Listing,
    ListingResponse,
    MergeRequest,
    ExplodeRequest,
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


def get_conn() -> Generator[Conn, None, None]:
    """Create a database transaction for the request."""
    with engine.begin() as conn:
        yield conn


def get_listing(
    limit: int = Query(50, description="Number of objects to return", le=5000),
    offset: int = Query(0, description="Skip the first N objects in response"),
    sort: Optional[str] = Query(
        None, description="Sort criterion, format: field:direction"
    ),
) -> Listing:
    direction = "desc"
    if sort is not None and ":" in sort:
        sort, direction = sort.rsplit(":", 1)
        direction = direction.lower().strip()
        direction = "asc" if direction == "asc" else "desc"
    return Listing(
        limit=limit,
        offset=offset,
        sort_direction=direction,
        sort_field=sort,
    )


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
):
    return list_stories(conn, listing, query=q)


@app.get("/stories/{story_id}", response_model=Story)
def article_view(
    conn: Conn = Depends(get_conn),
    story_id: str = Path(),
):
    story = fetch_story(conn, story_id)
    if story is None:
        raise HTTPException(404)
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


@app.get("/links", response_model=ListingResponse[Link])
def links_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    cluster: List[str] = Query([]),
):
    clusters = [i for i in cluster if i is not None and len(i.strip())]
    return list_links(conn, listing, clusters)


@app.post("/links", response_model=Link)
def links_save(
    link: LinkBase,
    conn: Conn = Depends(get_conn),
):
    # * make a link (any type)
    #   * see all sentences that mention both tags/identities
    #   * pick a relationship type
    result = create_link(conn, link.source, link.target, link.type)
    return result


@app.post("/links/_merge", response_model=ClusterDetails)
def merge_cluster_save(
    data: MergeRequest,
    conn: Conn = Depends(get_conn),
):
    cluster = merge_cluster(conn, data.anchor, data.other)
    return fetch_cluster(conn, cluster)


@app.post("/links/_explode", response_model=ClusterDetails)
def explode_cluster_save(
    data: ExplodeRequest,
    conn: Conn = Depends(get_conn),
):
    cluster = explode_cluster(conn, data.cluster)
    return fetch_cluster(conn, cluster)
