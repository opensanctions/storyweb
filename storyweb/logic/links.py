import logging
from datetime import datetime
from typing import List, Set, Dict, Tuple
from sqlalchemy.sql import select, delete, update, and_, or_, func

from storyweb.db import Conn, upsert, engine
from storyweb.db import tag_table, link_table
from storyweb.clean import most_common
from storyweb.logic.util import count_stmt
from storyweb.models import Link, Listing, ListingResponse
from storyweb.ontology import LinkType

log = logging.getLogger(__name__)


def list_links(
    conn: Conn, listing: Listing, clusters: List[str]
) -> ListingResponse[Link]:
    link_t = link_table.alias("l")
    stmt = select(link_t)
    for cluster in clusters:
        stmt = stmt.filter(
            or_(
                link_t.c.source_cluster == cluster,
                link_t.c.target_cluster == cluster,
            )
        )
    total = count_stmt(conn, stmt, link_t.c.type)
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [Link.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[Link](
        total=total,
        debug_msg=str(stmt),
        limit=listing.limit,
        offset=listing.offset,
        results=results,
    )


def get_links(conn: Conn, left: str, right: str) -> List[Link]:
    link_t = link_table.alias("l")
    stmt = select(link_t)
    stmt = stmt.filter(
        or_(
            and_(link_t.c.source_cluster == left, link_t.c.target_cluster == right),
            and_(link_t.c.target_cluster == left, link_t.c.source_cluster == right),
        )
    )
    cursor = conn.execute(stmt)
    return [Link.parse_obj(r) for r in cursor.fetchall()]


def clear_links(conn: Conn, left: str, right: str) -> None:
    link_t = link_table.alias("l")
    stmt = delete(link_t)
    stmt = stmt.filter(
        or_(
            and_(link_t.c.source_cluster == left, link_t.c.target_cluster == right),
            and_(link_t.c.source == left, link_t.c.target_cluster == right),
            and_(link_t.c.target_cluster == left, link_t.c.source_cluster == right),
            and_(link_t.c.target == left, link_t.c.source_cluster == right),
        )
    )
    res = conn.execute(stmt)
    print("CLEAR LINK", res.rowcount)


def create_link(conn: Conn, source: str, target: str, type: str) -> Link:
    link = Link(
        source=source,
        source_cluster=source,
        target=target,
        target_cluster=target,
        type=type,
        user="web",
        timestamp=datetime.utcnow(),
    )
    clear_links(conn, source, target)
    save_links(conn, [link])
    if link.type == LinkType.SAME:
        update_cluster(conn, link.source)
        update_cluster(conn, link.target)
    return link


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


def save_links(conn: Conn, links: List[Link]) -> None:
    istmt = upsert(link_table).values([l.dict() for l in links])
    values = dict(
        type=istmt.excluded.type,
        user=istmt.excluded.user,
        timestamp=istmt.excluded.timestamp,
    )
    stmt = istmt.on_conflict_do_update(index_elements=["source", "target"], set_=values)
    conn.execute(stmt)


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


def auto_merge(conn: Conn, check_links: bool = True):
    stmt = select(
        tag_table.c.fingerprint.label("fingerprint"),
        func.array_agg(tag_table.c.cluster).label("clusters"),
    )
    stmt = stmt.group_by(tag_table.c.fingerprint)
    stmt = stmt.order_by(func.count(tag_table.c.id).desc())
    stmt = stmt.having(func.count(tag_table.c.id) > 1)
    cursor = conn.execute(stmt)

    now = datetime.utcnow()
    while True:
        results = cursor.fetchmany(10000)
        if not results:
            break
        for row in results:
            with engine.begin() as inner:
                canonical = max(row["clusters"])
                links: Dict[Tuple[str, str], Link] = {}
                for ref in row["clusters"]:
                    if ref == canonical or ref is None:
                        continue
                    if check_links and len(get_links(inner, ref, canonical)) > 0:
                        continue
                    link = Link(
                        source=ref,
                        source_cluster=ref,
                        target=canonical,
                        target_cluster=canonical,
                        type=LinkType.SAME,
                        user="auto-merge",
                        timestamp=now,
                    )
                    links[(ref, canonical)] = link
                links_objs = list(links.values())
                if len(links_objs):
                    save_links(inner, links_objs)
                    log.info(
                        "Clusters: %s (%s merge %s)"
                        % (row["fingerprint"], canonical, len(links))
                    )
                    update_cluster(inner, canonical)

    # cstmt = select(tag_table.c.cluster.label("cluster"))
    # cstmt = cstmt.where(tag_table.c.id != tag_table.c.cluster)
    # cstmt = cstmt.group_by(tag_table.c.cluster)
    # cursor = conn.execute(cstmt)
    # clusters = [r.cluster for r in cursor.fetchall()]
    # for cluster in clusters:
    #     update_cluster(conn, cluster)
