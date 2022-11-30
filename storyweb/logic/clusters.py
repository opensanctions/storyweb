import logging
from datetime import datetime
from typing import List, Optional, Set
from sqlalchemy.sql import select, delete, update, func, or_

from storyweb.db import Conn
from storyweb.db import tag_table, link_table
from storyweb.clean import most_common
from storyweb.logic.util import count_stmt
from storyweb.models import (
    Cluster,
    ClusterDetails,
    Link,
    Listing,
    ListingResponse,
    RelatedCluster,
    SimilarCluster,
)
from storyweb.ontology import LinkType
from storyweb.logic.links import clear_links, save_links

log = logging.getLogger(__name__)


def list_clusters(
    conn: Conn,
    listing: Listing,
    query: Optional[str] = None,
    article: Optional[str] = None,
) -> ListingResponse[Cluster]:
    cluster_t = tag_table.alias("c")
    articles = func.count(func.distinct(cluster_t.c.article))
    stmt = select(
        cluster_t.c.cluster.label("id"),
        cluster_t.c.cluster_type.label("type"),
        cluster_t.c.cluster_label.label("label"),
        articles.label("articles"),
    )
    if query is not None and len(query.strip()):
        text_t = tag_table.alias("q")
        stmt = stmt.where(text_t.c.cluster == cluster_t.c.cluster)
        stmt = stmt.where(text_t.c.label.ilike(f"%{query}%"))

    if article is not None and len(article.strip()):
        article_t = tag_table.alias("a")
        stmt = stmt.where(article_t.c.cluster == cluster_t.c.cluster)
        stmt = stmt.where(article_t.c.article == article)

    total = count_stmt(conn, stmt, func.distinct(cluster_t.c.cluster))
    stmt = stmt.group_by(
        cluster_t.c.cluster,
        cluster_t.c.cluster_label,
        cluster_t.c.cluster_type,
    )
    stmt = stmt.order_by(articles.desc())
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    return ListingResponse[Cluster](
        total=total,
        debug_msg=str(stmt),
        limit=listing.limit,
        offset=listing.offset,
        results=[Cluster.parse_obj(r) for r in cursor.fetchall()],
    )


def fetch_cluster(conn: Conn, id: str) -> Optional[ClusterDetails]:
    # TODO: should this do an OR on cluster ID?
    cluster_t = tag_table.alias("c")
    articles = func.count(func.distinct(cluster_t.c.article))
    labels = func.array_agg(func.distinct(cluster_t.c.label))
    stmt = select(
        cluster_t.c.cluster.label("id"),
        cluster_t.c.cluster_type.label("type"),
        cluster_t.c.cluster_label.label("label"),
        articles.label("articles"),
        labels.label("labels"),
    )
    stmt = stmt.where(or_(cluster_t.c.id == id, cluster_t.c.cluster == id))
    stmt = stmt.group_by(
        cluster_t.c.cluster,
        cluster_t.c.cluster_label,
        cluster_t.c.cluster_type,
    )
    cursor = conn.execute(stmt)
    for row in cursor.fetchall():
        return ClusterDetails.parse_obj(row)
    return None


def list_similar(conn: Conn, listing: Listing, cluster: str):
    stmt_fp = select(func.distinct(tag_table.c.fingerprint).label("fingerprint"))
    stmt_fp = stmt_fp.where(tag_table.c.cluster == cluster)
    cte_fp = stmt_fp.cte("fingerprints")

    # TODO: add using TF/IDF
    tag_cluster = tag_table.alias("tcl")
    tag_coref = tag_table.alias("tco")
    stmt_co = select(func.distinct(tag_coref.c.fingerprint).label("fingerprint"))
    stmt_co = stmt_co.where(tag_cluster.c.article == tag_coref.c.article)
    stmt_co = stmt_co.where(tag_cluster.c.fingerprint != tag_coref.c.fingerprint)
    stmt_co = stmt_co.where(tag_cluster.c.cluster == cluster)
    # stmt_co = stmt_co.group_by(tag_coref.c.fingerprint)
    cte_co = stmt_co.cte("coref")

    other_cluster = tag_table.alias("ocl")
    other_coref = tag_table.alias("oco")
    stmt = select(
        other_cluster.c.cluster.label("id"),
        other_cluster.c.cluster_label.label("label"),
        other_cluster.c.cluster_type.label("type"),
        func.array_agg(func.distinct(other_coref.c.label)).label("common"),
        func.count(other_coref.c.id).label("common_count"),
    )
    stmt = stmt.select_from(cte_co)
    stmt = stmt.join(other_coref, other_coref.c.fingerprint == cte_co.c.fingerprint)
    stmt = stmt.join(other_cluster, other_cluster.c.article == other_coref.c.article)
    stmt = stmt.join(cte_fp, cte_fp.c.fingerprint == other_cluster.c.fingerprint)
    stmt = stmt.where(other_cluster.c.cluster != cluster)
    total = count_stmt(conn, stmt, func.distinct(other_cluster.c.cluster))
    stmt = stmt.group_by(
        other_cluster.c.cluster,
        other_cluster.c.cluster_label,
        other_cluster.c.cluster_type,
    )
    stmt = stmt.order_by(func.count(other_coref.c.id).desc())

    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [SimilarCluster.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[SimilarCluster](
        total=total,
        debug_msg=str(stmt),
        results=results,
        limit=listing.limit,
        offset=listing.offset,
    )


def list_related(
    conn: Conn, listing: Listing, cluster: str, linked: Optional[bool] = None
) -> ListingResponse[RelatedCluster]:
    link_fwd = link_table.alias("fwd")
    link_bck = link_table.alias("bck")
    stmt_fwd = select(link_fwd.c.target_cluster.label("cluster"), link_fwd.c.type)
    stmt_fwd = stmt_fwd.filter(link_fwd.c.source_cluster == cluster)
    stmt_bck = select(link_bck.c.source_cluster.label("cluster"), link_bck.c.type)
    stmt_bck = stmt_bck.filter(link_bck.c.target_cluster == cluster)
    cte = stmt_fwd.cte("links").union(stmt_bck)

    tag_t = tag_table.alias("t")
    cluster_t = tag_table.alias("c")

    articles = func.count(func.distinct(cluster_t.c.article))

    stmt = select(
        tag_t.c.cluster.label("id"),
        tag_t.c.cluster_label.label("label"),
        tag_t.c.cluster_type.label("type"),
        articles.label("articles"),
    )
    if linked is not False:
        link_types = func.array_remove(func.array_agg(func.distinct(cte.c.type)), None)
        stmt = stmt.add_columns(link_types.label("link_types"))
    stmt = stmt.where(tag_t.c.article == cluster_t.c.article)
    stmt = stmt.where(tag_t.c.cluster != cluster)
    stmt = stmt.where(cluster_t.c.cluster == cluster)

    if linked is False:
        stmt = stmt.where(tag_t.c.cluster.not_in(select(cte.c.cluster)))
    else:
        stmt = stmt.outerjoin(cte, cte.c.cluster == tag_t.c.cluster)
        if linked is True:
            stmt = stmt.where(cte.c.type != None)

    total = count_stmt(conn, stmt, func.distinct(tag_t.c.cluster))
    stmt = stmt.group_by(
        tag_t.c.cluster,
        tag_t.c.cluster_label,
        tag_t.c.cluster_type,
    )
    stmt = stmt.order_by(articles.desc())
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [RelatedCluster.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[RelatedCluster](
        total=total,
        debug_msg=str(stmt),
        results=results,
        limit=listing.limit,
        offset=listing.offset,
    )


def merge_cluster(conn: Conn, anchor: str, others: List[str]) -> str:
    timestamp = datetime.utcnow()
    links: List[Link] = []
    for other in others:
        link = Link(
            source=anchor,
            source_cluster=anchor,
            target=other,
            target_cluster=other,
            type=LinkType.SAME,
            user="web",
            timestamp=timestamp,
        )
        links.append(link)
        clear_links(conn, anchor, other)
    save_links(conn, links)
    return update_cluster(conn, anchor)


def explode_cluster(conn: Conn, cluster: str) -> str:
    referents = compute_cluster(conn, cluster)
    link_t = link_table.alias("l")
    stmt = delete(link_t)
    stmt = stmt.filter(
        or_(link_t.c.source_cluster == cluster, link_t.c.target_cluster == cluster)
    )
    conn.execute(stmt)
    for ref in referents:
        update_cluster(conn, ref)
    return cluster


def untag_article(conn: Conn, cluster: str, article: str) -> str:
    sstmt = select(tag_table)
    sstmt = sstmt.filter(tag_table.c.article == article)
    sstmt = sstmt.filter(tag_table.c.cluster == cluster)
    row = conn.execute(sstmt).fetchone()
    if row is None:
        return cluster
    tag_id = row["id"]
    if tag_id == cluster:
        raise ValueError("This is the root article for the cluster")

    # stmt = update(tag_table)
    # stmt = stmt.values({"cluster": tag_id})
    # stmt = stmt.where(tag_table.c.cluster == cluster)
    # stmt = stmt.where(tag_table.c.article == article)
    # print("STMT", stmt, tag_id, cluster, article)
    # conn.execute(stmt)
    clear_links(conn, tag_id, cluster)
    update_cluster(conn, cluster)
    update_cluster(conn, tag_id)
    return cluster


def update_cluster(conn: Conn, id: str) -> str:
    referents = compute_cluster(conn, id)
    cluster = max(referents)

    sstmt = select(tag_table)
    sstmt = sstmt.where(tag_table.c.id.in_(referents))
    res = conn.execute(sstmt)
    rows = res.fetchall()
    cluster_label = most_common([r.label for r in rows])
    cluster_type = most_common([r.type for r in rows])

    stmt = update(tag_table)
    stmt = stmt.where(tag_table.c.id.in_(referents))
    # stmt = stmt.where(
    #     or_(
    #         tag_table.c.cluster != cluster,
    #         tag_table.c.cluster_label != cluster_label,
    #         tag_table.c.cluster_type != cluster_type,
    #     )
    # )
    stmt = stmt.values(
        cluster=cluster,
        cluster_label=cluster_label,
        cluster_type=cluster_type,
    )
    conn.execute(stmt)

    stmt = update(link_table)
    stmt = stmt.where(link_table.c.source.in_(referents))
    stmt = stmt.where(link_table.c.source_cluster != cluster)
    stmt = stmt.values(source_cluster=cluster)
    conn.execute(stmt)

    stmt = update(link_table)
    stmt = stmt.where(link_table.c.target.in_(referents))
    stmt = stmt.where(link_table.c.target_cluster != cluster)
    stmt = stmt.values(target_cluster=cluster)
    conn.execute(stmt)
    return cluster


def compute_cluster(conn: Conn, id: str) -> Set[str]:
    link_t = link_table.alias("l")
    target = link_t.c.target
    source = link_t.c.source
    # type_c = link_t.c.type
    # init_clause = or_(source == id, target == id)
    # stmt_t = stmt_t.where(init_clause, type_c == LinkType.SAME)
    # cte = stmt_t.cte("connected", recursive=True)
    # cte_alias = cte.alias("c")
    # stmt_r = select(target.label("target"), source.label("source"))
    # join_clause = or_(
    #     cte_alias.c.source == source,
    #     cte_alias.c.source == target,
    #     cte_alias.c.target == source,
    #     cte_alias.c.target == target,
    # )
    # stmt_r = stmt_r.join(cte_alias, join_clause)
    # stmt_r = stmt_r.where(type_c == LinkType.SAME)
    # cte = cte.union(stmt_r)  # type: ignore

    # stmt = select(cte.c.source, cte.c.target)
    # connected = set([id])
    # for row in conn.execute(stmt).fetchall():
    #     connected.add(row.source)
    #     connected.add(row.target)
    # return connected
    connected = set([id])
    fresh = set([id])
    while len(fresh):
        stmt = select(target.label("target"), source.label("source"))
        stmt = stmt.filter(link_t.c.type == LinkType.SAME)
        stmt = stmt.filter(or_(source.in_(fresh), target.in_(fresh)))
        fresh = set()
        for row in conn.execute(stmt):
            for node in (row.source, row.target):
                if node not in connected:
                    fresh.add(node)
                    connected.add(node)
    return connected
