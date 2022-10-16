from uuid import uuid4
from datetime import datetime
from typing import Iterable, List, Optional, Set
from sqlalchemy.sql import select, delete, update, insert, func, and_, or_

from storyweb.db import Conn, upsert
from storyweb.db import article_table, sentence_table
from storyweb.db import tag_table, link_table, tag_sentence_table
from storyweb.db import fingerprint_idf_table
from storyweb.links import link_types
from storyweb.clean import most_common, pick_name
from storyweb.models import (
    Cluster,
    ClusterListingResponse,
    Link,
    Article,
    ArticleTag,
    ArticleTagListingResponse,
    Sentence,
    Site,
    Tag,
    TagSentence,
)
from storyweb.ontology import pick_category


def list_sites(conn: Conn) -> List[Site]:
    stmt = select(
        article_table.c.site,
        func.count(article_table.c.id).label("articles"),
    )
    stmt = stmt.group_by(article_table.c.site)
    stmt = stmt.order_by(article_table.c.site)
    cursor = conn.execute(stmt)
    return [Site.parse_obj(r) for r in cursor.fetchall()]


def list_tags(
    conn: Conn,
    sites: List[str] = [],
    query: Optional[str] = None,
) -> ArticleTagListingResponse:
    tag_t = tag_table.alias("t")
    article_t = article_table.alias("a")
    stmt = select(
        article_t.c.id.label("article_id"),
        article_t.c.title.label("article_title"),
        article_t.c.url.label("article_url"),
        article_t.c.site.label("article_site"),
        tag_t.c.id.label("id"),
        tag_t.c.cluster.label("cluster"),
        tag_t.c.fingerprint.label("fingerprint"),
        tag_t.c.cluster_category.label("category"),
        tag_t.c.cluster_label.label("label"),
        tag_t.c.count.label("count"),
    )
    if len(sites):
        stmt = stmt.filter(article_t.c.site.in_(sites))
    if query is not None and len(query.strip()):
        stmt = stmt.filter(tag_t.c.label.ilike(f"%{query}%"))

    stmt = stmt.join(article_t, tag_t.c.article == article_t.c.id)
    stmt = stmt.order_by(tag_t.c.count.desc())
    stmt = stmt.limit(100)
    cursor = conn.execute(stmt)
    response = ArticleTagListingResponse(limit=100, offset=0, results=[])
    response.debug_msg = str(stmt)
    for row in cursor.fetchall():
        article = Article(
            id=row["article_id"],
            site=row["article_site"],
            url=row["article_url"],
            title=row["article_title"],
        )
        tag = ArticleTag(
            article=article,
            id=row["id"],
            cluster=row["cluster"],
            fingerprint=row["fingerprint"],
            category=row["category"],
            label=row["label"],
            count=row["count"],
        )
        response.results.append(tag)
    return response


def list_clusters(
    conn: Conn,
    query: Optional[str] = None,
    coref: str = None,
    linked: Optional[bool] = None,
) -> ClusterListingResponse:
    tag_t = tag_table.alias("t")
    link_t = link_table.alias("link")
    stmt = select(
        tag_t.c.cluster.label("id"),
        func.max(tag_t.c.cluster_category).label("category"),
        func.max(tag_t.c.cluster_label).label("label"),
        func.count(func.distinct(tag_t.c.id)).label("tags"),
        func.sum(tag_t.c.count).label("count"),
    )
    # if query is not None and len(query.strip()):
    #     stmt = stmt.filter(tag_t.c.label.ilike(f"%{query}%"))

    if coref is not None:
        coref_t = tag_table.alias("coref")
        # local_t = tag_table.alias("local")
        stmt = stmt.where(tag_t.c.cluster != coref)
        stmt = stmt.where(coref_t.c.cluster == coref)
        clause_occur = and_(
            coref_t.c.article == tag_t.c.article,
        )
        # stmt = stmt.where(or_(clause_occur))
        clause_alias = and_(
            coref_t.c.fingerprint == tag_t.c.fingerprint,
        )
        # stmt = stmt.where(or_(clause_alias))
        stmt = stmt.where(or_(clause_occur, clause_alias))

        link_in = and_(
            link_t.c.target_cluster == coref,
            link_t.c.source_cluster == tag_t.c.cluster,
        )
        link_out = and_(
            link_t.c.source_cluster == coref,
            link_t.c.target_cluster == tag_t.c.cluster,
        )

        stmt = stmt.outerjoin(link_t, or_(link_in, link_out))
        if linked is True:
            stmt = stmt.where(link_t.c.type != None)
        if linked is False:
            stmt = stmt.where(link_t.c.type == None)
        stmt = stmt.add_columns(func.array_agg(link_t.c.type).label("link_types"))

    stmt = stmt.group_by(tag_t.c.cluster)
    stmt = stmt.order_by(
        func.count(func.distinct(tag_t.c.id)).desc(),
        func.sum(tag_t.c.count).desc(),
    )
    stmt = stmt.limit(100)
    # print(stmt)
    cursor = conn.execute(stmt)
    response = ClusterListingResponse(limit=100, offset=0, results=[])
    response.debug_msg = str(stmt)
    for row in cursor.fetchall():
        link_type = None
        if "link_types" in row:
            link_type = most_common(row["link_types"])
        cluster = Cluster(
            id=row["id"],
            category=row["category"],
            label=row["label"],
            count=row["count"],
            tags=row["tags"],
            link_type=link_type,
        )
        response.results.append(cluster)
    return response


def list_links(conn: Conn, clusters: List[str]) -> List[Link]:
    link_t = link_table.alias("l")
    stmt = select(link_t)
    for cluster in clusters:
        stmt = stmt.filter(
            or_(
                link_t.c.source_cluster == cluster,
                link_t.c.target_cluster == cluster,
            )
        )
    stmt = stmt.limit(100)
    cursor = conn.execute(stmt)
    return [Link.parse_obj(r) for r in cursor.fetchall()]


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
    save_link(conn, link)
    if link.type == link_types.SAME.name:
        update_cluster(conn, link.source)
        update_cluster(conn, link.target)
    return link


def save_link(conn: Conn, link: Link) -> None:
    # TODO: compute connected components on clusters
    # generate a mapping table, or maybe a materialised view
    # update identity and link tables from mapping table
    istmt = upsert(link_table).values(link.dict())
    values = dict(
        type=istmt.excluded.type,
        user=istmt.excluded.user,
        timestamp=istmt.excluded.timestamp,
    )
    stmt = istmt.on_conflict_do_update(index_elements=["source", "target"], set_=values)
    conn.execute(stmt)


def update_cluster(conn: Conn, id: str) -> None:
    referents = compute_cluster(conn, id)
    cluster = max(referents)

    sstmt = select(tag_table)
    sstmt = sstmt.where(tag_table.c.id.in_(referents))
    res = conn.execute(sstmt)
    rows = res.fetchall()
    cluster_label = most_common([r.label for r in rows])
    cluster_category = most_common([r.category for r in rows])

    stmt = update(tag_table)
    stmt = stmt.where(tag_table.c.id.in_(referents))
    stmt = stmt.where(
        or_(
            tag_table.c.cluster != cluster,
            tag_table.c.cluster_label != cluster_label,
            tag_table.c.cluster_category != cluster_category,
        )
    )
    stmt = stmt.values(
        cluster=cluster,
        cluster_label=cluster_label,
        cluster_category=cluster_category,
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


def compute_cluster(conn: Conn, id: str) -> Set[str]:
    link_t = link_table.alias("l")
    target = link_t.c.target
    source = link_t.c.source
    type_c = link_t.c.type
    same_as = link_types.SAME.name
    stmt_t = select(target.label("target"), source.label("source"))
    init_clause = or_(source == id, target == id)
    stmt_t = stmt_t.where(init_clause, type_c == same_as)
    cte = stmt_t.cte("connected", recursive=True)
    cte_alias = cte.alias("c")
    stmt_r = select(target.label("target"), source.label("source"))
    join_clause = or_(
        cte_alias.c.source == source,
        cte_alias.c.source == target,
        cte_alias.c.target == source,
        cte_alias.c.target == target,
    )
    stmt_r = stmt_r.join(cte_alias, join_clause)
    stmt_r = stmt_r.where(type_c == same_as)
    cte = cte.union(stmt_r)  # type: ignore

    stmt = select(cte.c.source, cte.c.target)
    # print(stmt)
    connected = set([id])
    for row in conn.execute(stmt).fetchall():
        connected.add(row.source)
        connected.add(row.target)
    return connected


def get_tag_by_id(conn: Conn, id: str) -> Optional[Tag]:
    # TODO: should this do an OR on cluster ID?
    stmt = select(tag_table)
    stmt = stmt.where(tag_table.c.id == id)
    stmt = stmt.limit(1)
    cursor = conn.execute(stmt)
    for row in cursor.fetchall():
        tag = Tag.parse_obj(row)
        tag.label = row.cluster_label
        tag.category = row.cluster_category
    return None


# def get_cluster(conn: Conn, cluster: str) -> List[Tag]:
#     # Get all the parts of a clustered identity
#     stmt = select(tag_table)
#     stmt = stmt.where(tag_table.c.cluster == cluster)
#     cursor = conn.execute(stmt)
#     return [Tag.parse_obj(r) for r in cursor.fetchall()]


def save_article(conn: Conn, article: Article) -> None:
    istmt = upsert(article_table).values([article.dict()])
    values = dict(
        site=istmt.excluded.site,
        url=istmt.excluded.url,
        title=istmt.excluded.title,
    )
    stmt = istmt.on_conflict_do_update(index_elements=["id"], set_=values)
    conn.execute(stmt)


def save_extracted(
    conn: Conn,
    article: Article,
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
            category=istmt.excluded.category,
            label=istmt.excluded.label,
            count=istmt.excluded.count,
        )
        ustmt = istmt.on_conflict_do_update(index_elements=["id"], set_=updates)
        conn.execute(ustmt)


def compute_idf(conn: Conn):
    cstmt = select(func.count(article_table.c.id))
    article_count = float(conn.execute(cstmt).scalar())
    print("Article count", article_count)

    conn.execute(delete(fingerprint_idf_table))
    gstmt = select(
        tag_table.c.fingerprint,
        func.log(article_count / func.count(tag_table.c.article)),
    )
    gstmt = gstmt.group_by(tag_table.c.fingerprint)
    stmt = fingerprint_idf_table.insert()
    stmt = stmt.from_select(["fingerprint", "frequency"], gstmt)
    print("Update tf/idf", stmt)
    conn.execute(stmt)
