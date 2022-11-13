from datetime import datetime
import logging
from typing import Dict, Iterable, List, Optional, Set, Tuple
from sqlalchemy.sql import select, delete, update, insert, func, and_, or_
from sqlalchemy.sql.expression import literal

from storyweb.db import Conn, upsert, engine
from storyweb.db import article_table, sentence_table
from storyweb.db import tag_table, link_table, tag_sentence_table
from storyweb.clean import most_common
from storyweb.models import (
    ArticleDetails,
    Cluster,
    ClusterDetails,
    Link,
    Article,
    Listing,
    ListingResponse,
    RelatedCluster,
    Sentence,
    SimilarCluster,
    Site,
    Tag,
    TagSentence,
)
from storyweb.ontology import ontology, LinkType

log = logging.getLogger(__name__)


def list_sites(conn: Conn, listing: Listing) -> ListingResponse[Site]:
    stmt = select(
        article_table.c.site,
        func.count(article_table.c.id).label("articles"),
    )
    stmt = stmt.group_by(article_table.c.site)
    stmt = stmt.order_by(article_table.c.site)
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [Site.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[Site](
        debug_msg=str(stmt),
        limit=listing.limit,
        offset=listing.offset,
        results=results,
    )


def list_articles(
    conn: Conn,
    listing: Listing,
    site: Optional[str] = None,
    query: Optional[str] = None,
    clusters: List[str] = [],
) -> ListingResponse[Article]:
    stmt = select(
        article_table.c.id,
        article_table.c.title,
        article_table.c.url,
        article_table.c.language,
        article_table.c.site,
        article_table.c.tags,
        article_table.c.mentions,
    )
    if site is not None and len(site.strip()):
        stmt = stmt.where(article_table.c.site == site)
    if query is not None and len(query.strip()):
        stmt = stmt.where(article_table.c.title.ilike(f"%{query}%"))
    for cluster in clusters:
        cluster_t = tag_table.alias()
        stmt = stmt.join(cluster_t, cluster_t.c.article == article_table.c.id)
        stmt = stmt.where(cluster_t.c.cluster == cluster)
    if listing.sort_field is not None:
        column = article_table.c[listing.sort_field]
        if listing.sort_direction == "desc":
            stmt = stmt.order_by(column.desc())
        else:
            stmt = stmt.order_by(column.asc())
    stmt = stmt.group_by(
        article_table.c.id,
        article_table.c.title,
        article_table.c.url,
        article_table.c.language,
        article_table.c.site,
        article_table.c.tags,
        article_table.c.mentions,
    )
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [Article.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[Article](
        debug_msg=str(stmt),
        limit=listing.limit,
        offset=listing.offset,
        results=results,
    )


def fetch_article(conn: Conn, article_id: str) -> Optional[ArticleDetails]:
    stmt = select(article_table)
    stmt = stmt.where(article_table.c.id == article_id)
    stmt = stmt.limit(1)
    cursor = conn.execute(stmt)
    obj = cursor.fetchone()
    if obj is None:
        return None
    return ArticleDetails.parse_obj(obj)


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

    stmt = stmt.group_by(
        cluster_t.c.cluster,
        cluster_t.c.cluster_label,
        cluster_t.c.cluster_type,
    )
    stmt = stmt.order_by(articles.desc())
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    return ListingResponse[Cluster](
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
        debug_msg=str(stmt),
        results=results,
        limit=listing.limit,
        offset=listing.offset,
    )


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
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [Link.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[Link](
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
            and_(link_t.c.target_cluster == left, link_t.c.source_cluster == right),
        )
    )
    conn.execute(stmt)


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


def save_article(conn: Conn, article: ArticleDetails) -> None:
    istmt = upsert(article_table).values([article.dict()])
    values = dict(
        site=istmt.excluded.site,
        url=istmt.excluded.url,
        title=istmt.excluded.title,
        language=istmt.excluded.language,
        text=istmt.excluded.text,
    )
    stmt = istmt.on_conflict_do_update(index_elements=["id"], set_=values)
    conn.execute(stmt)


def save_extracted(
    conn: Conn,
    article: ArticleDetails,
    sentences: Iterable[Sentence],
    tag_sentences: Iterable[TagSentence],
    tags: Iterable[Tag],
) -> None:
    save_article(conn, article)
    stmt = delete(sentence_table)
    stmt = stmt.where(sentence_table.c.article == article.id)
    conn.execute(stmt)
    sentence_values = [s.dict() for s in sentences]
    if len(sentence_values):
        sstmt = insert(sentence_table).values(sentence_values)
        conn.execute(sstmt)

    stmt = delete(tag_sentence_table)
    stmt = stmt.where(tag_sentence_table.c.article == article.id)
    conn.execute(stmt)
    tag_sentence_values = [s.dict() for s in tag_sentences]
    if len(tag_sentence_values):
        sstmt = insert(tag_sentence_table).values(tag_sentence_values)
        conn.execute(sstmt)

    tag_values = [t.dict() for t in tags]
    if len(tag_values):
        istmt = upsert(tag_table).values(tag_values)
        updates = dict(
            type=istmt.excluded.type,
            label=istmt.excluded.label,
            count=istmt.excluded.count,
            frequency=istmt.excluded.frequency,
        )
        ustmt = istmt.on_conflict_do_update(index_elements=["id"], set_=updates)
        conn.execute(ustmt)


# def compute_idf(conn: Conn):
#     cstmt = select(func.count(article_table.c.id))
#     article_count = float(conn.execute(cstmt).scalar())
#     print("Article count", article_count)

#     conn.execute(delete(fingerprint_idf_table))
#     gstmt = select(
#         tag_table.c.fingerprint,
#         func.count(tag_table.c.article),
#         func.log(article_count / func.count(tag_table.c.article)),
#     )
#     gstmt = gstmt.group_by(tag_table.c.fingerprint)
#     stmt = fingerprint_idf_table.insert()
#     stmt = stmt.from_select(["fingerprint", "count", "frequency"], gstmt)
#     print("Update tf/idf", stmt)
#     conn.execute(stmt)


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
