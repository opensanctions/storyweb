from typing import Generator, List, Optional
from fastapi import FastAPI, Depends, Path, Query
from fastapi.exceptions import HTTPException

from storyweb.links import link_types
from storyweb.ontology import ENTITY
from storyweb.db import engine, Conn
from storyweb.logic import (
    create_link,
    get_tag_by_id,
    list_clusters,
    list_links,
    list_sites,
    list_tags,
)
from storyweb.models import (
    ClusterListingResponse,
    Link,
    LinkBase,
    LinkListingResponse,
    LinkTypeListingResponse,
    ArticleTagListingResponse,
    SiteListingResponse,
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


@app.get("/sites")
def sites_index(conn: Conn = Depends(get_conn)):
    """List all the source sites from which articles (refs) have been imported."""
    sites = list_sites(conn)
    return SiteListingResponse(limit=len(sites), results=sites)


@app.get("/tags", response_model=ArticleTagListingResponse)
def tags_index(
    conn: Conn = Depends(get_conn),
    q: Optional[str] = Query(None),
    site: List[str] = Query([]),
):
    sites = [s for s in site if s is not None and len(s.strip())]
    tags = list_tags(conn, sites=sites, query=q)
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


@app.get("/clusters", response_model=ClusterListingResponse)
def clusters_index(
    conn: Conn = Depends(get_conn),
    q: Optional[str] = Query(None),
    coref: Optional[str] = Query(None),
    linked: Optional[bool] = Query(None),
):
    tags = list_clusters(conn, query=q, coref=coref, linked=linked)
    return tags


@app.get("/linktypes")
def link_types_index():
    return LinkTypeListingResponse(limit=0, offset=0, results=link_types.all())


@app.get("/links")
def links_index(
    conn: Conn = Depends(get_conn),
    cluster: List[str] = Query([]),
):
    clusters = [i for i in cluster if i is not None and len(i.strip())]
    links = list_links(conn, clusters)
    return LinkListingResponse(results=links, limit=100, offset=0)


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
