from typing import Generator, List, Optional
from fastapi import FastAPI, Depends, Path, Query
from fastapi.responses import RedirectResponse
from fastapi.exceptions import HTTPException

from storyweb.links import link_types
from storyweb.clean import most_common, pick_name
from storyweb.db import engine, Conn
from storyweb.logic import (
    create_identity,
    create_link,
    get_identity_by_id,
    get_identity_by_ref_key,
    list_identity_tags,
    list_links,
    list_sites,
    list_tags,
)
from storyweb.models import (
    Link,
    LinkBase,
    LinkListingResponse,
    LinkTypeListingResponse,
    RefTagListingResponse,
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


# * get the set of (unprocessed) tags (site/ilike search)
#
# /tags/?site=xxxx&q=putin
# {'text', 'texts', 'key', 'ref_id', 'ref_site', 'ref_title', 'ref_url', 'identity_id', 'identity_cluster'}
@app.get("/tags", response_model=RefTagListingResponse)
def tags_index(
    conn: Conn = Depends(get_conn),
    q: Optional[str] = Query(None),
    site: List[str] = Query([]),
    coref: Optional[str] = Query(None),
    coref_linked: Optional[bool] = Query(None),
):
    sites = [s for s in site if s is not None and len(s.strip())]
    tags = list_tags(conn, sites=sites, query=q, coref=coref, coref_linked=coref_linked)
    return tags


@app.get("/tags/{ref_id}/{key}")
def tag_identity(
    conn: Conn = Depends(get_conn), ref_id: str = Path(), key: str = Path()
):
    identity = get_identity_by_ref_key(conn, ref_id, key)
    if identity is None:
        identity = create_identity(conn, key, ref_id, user="web")
    url = app.url_path_for("get_identity", id=identity.id)
    return RedirectResponse(status_code=308, url=url)


@app.get("/identities/{id}")
def get_identity(conn: Conn = Depends(get_conn), id: str = Path()):
    identity = get_identity_by_id(conn, id)
    if identity is None:
        raise HTTPException(404)
    tags = list_identity_tags(conn, identity.cluster)
    identity.category = most_common([t.category for t in tags])
    identity.label = pick_name([t.text for t in tags])
    return identity


@app.get("/linktypes")
def link_types_index():
    return LinkTypeListingResponse(limit=0, offset=0, results=link_types.all())


@app.get("/links")
def links_index(
    conn: Conn = Depends(get_conn),
    identity: List[str] = Query([]),
):
    identities = [i for i in identity if i is not None and len(i.strip())]
    links = list_links(conn, identities)
    return LinkListingResponse(results=links, limit=100, offset=0)


@app.post("/links")
def links_save(
    link: LinkBase,
    conn: Conn = Depends(get_conn),
):
    result = create_link(conn, link.source, link.target, link.type)
    return result


# /identities/?q=putin
# {'cluster_id', 'identity_ids', 'text', 'texts'}
#
# POST /identities <- {'key', 'ref_id', 'cluster'}
#
# /identities/xxxx
# {'cluster', 'text', 'tags': [{}], }
#
# /identities/xxxx/cooccuring?unlinked=true
# {'key', 'refs', 'count'}
#
# /identities/xxxx/links  (or /link?identity=xxxx ?)
# {'source_id', 'target_id', 'type', ...}
#
# * view an identity
#   * see all possible aliases (same name, different article tags)
#   * see all possible links
#   * see all existing links
#
# * make a link (any type)
#   * see all sentences that mention both tags/identities
#   * pick a relationship type
#
# *
