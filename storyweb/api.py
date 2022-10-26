from typing import Generator, List, Optional
from fastapi import FastAPI, Depends, Path, Query
from fastapi.exceptions import HTTPException

from storyweb.links import link_types
from storyweb.db import engine, Conn
from storyweb.logic import (
    create_link,
    get_tag_by_id,
    list_articles,
    list_clusters,
    list_links,
    list_related,
    list_similar,
    list_sites,
    list_tags,
)
from storyweb.models import (
    ArticleListingResponse,
    ClusterListingResponse,
    LinkBase,
    LinkTypeListingResponse,
    ArticleTagListingResponse,
    Listing,
    ListingResponse,
    RelatedCluster,
    SimilarCluster,
    Site,
)

app = FastAPI(
    title="storyweb",
    description="make networks from text",
    redoc_url="/",
)


def get_conn() -> Generator[Conn, None, None]:
    """Create a database transaction for the request."""
    with engine.begin() as conn:
        yield conn


def get_listing(
    limit: int = Query(50, description="Number of objects to return", le=500),
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


@app.get("/articles", response_model=ArticleListingResponse)
def articles_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    site: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
):
    return list_articles(conn, listing, site=site, query=q)


@app.get("/tags", response_model=ArticleTagListingResponse)
def tags_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    q: Optional[str] = Query(None),
    site: List[str] = Query([]),
):
    sites = [s for s in site if s is not None and len(s.strip())]
    tags = list_tags(conn, listing, sites=sites, query=q)
    return tags


@app.get("/tags/{tag_id}")
def get_tag(conn: Conn = Depends(get_conn), tag_id: str = Path()):
    # TODO:
    # * view an identity
    #   * see all possible aliases (same name, different article tags)
    #   * see all possible links
    #   * see all existing links
    tag = get_tag_by_id(conn, tag_id)
    if tag is None:
        raise HTTPException(404)
    return tag


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


@app.get("/clusters", response_model=ClusterListingResponse)
def route_cluster_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    q: Optional[str] = Query(None),
    coref: Optional[str] = Query(None),
    linked: Optional[bool] = Query(None),
):
    return list_clusters(conn, listing, query=q, coref=coref, linked=linked)


@app.get("/linktypes")
def link_types_index():
    return LinkTypeListingResponse(limit=10000, offset=0, results=link_types.all())


@app.get("/links")
def links_index(
    conn: Conn = Depends(get_conn),
    listing: Listing = Depends(get_listing),
    cluster: List[str] = Query([]),
):
    clusters = [i for i in cluster if i is not None and len(i.strip())]
    return list_links(conn, listing, clusters)


@app.post("/links")
def links_save(
    link: LinkBase,
    conn: Conn = Depends(get_conn),
):
    # * make a link (any type)
    #   * see all sentences that mention both tags/identities
    #   * pick a relationship type
    result = create_link(conn, link.source, link.target, link.type)
    return result
