import logging
from datetime import datetime
from typing import Dict, Iterable, List, Optional, Tuple
from sqlalchemy.sql import select, delete, insert, func

from storyweb.db import Conn, upsert, engine
from storyweb.db import article_table, sentence_table
from storyweb.db import tag_table, tag_sentence_table
from storyweb.db import story_article_table
from storyweb.logic.util import count_stmt
from storyweb.models import (
    ArticleDetails,
    Link,
    Article,
    Listing,
    ListingResponse,
    Sentence,
    Site,
    Tag,
    TagSentence,
)
from storyweb.ontology import LinkType
from storyweb.logic.links import get_links, save_links, update_cluster

log = logging.getLogger(__name__)


def list_sites(conn: Conn, listing: Listing) -> ListingResponse[Site]:
    stmt = select(
        article_table.c.site,
        func.count(article_table.c.id).label("articles"),
    )
    total = count_stmt(conn, stmt, func.distinct(article_table.c.site))
    stmt = stmt.group_by(article_table.c.site)
    stmt = stmt.order_by(article_table.c.site)
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [Site.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[Site](
        total=total,
        debug_msg=str(stmt),
        limit=listing.limit,
        offset=listing.offset,
        results=results,
    )


def list_articles(
    conn: Conn,
    listing: Listing,
    site: Optional[str] = None,
    story: Optional[int] = None,
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
    stmt = stmt.select_from(article_table)
    if site is not None and len(site.strip()):
        stmt = stmt.where(article_table.c.site == site)
    if query is not None and len(query.strip()):
        stmt = stmt.where(article_table.c.title.ilike(f"%{query}%"))
    if story is not None:
        stmt = stmt.join(
            story_article_table,
            story_article_table.c.article == article_table.c.id,
        )
        stmt = stmt.where(story_article_table.c.story == story)
    for cluster in clusters:
        cluster_t = tag_table.alias()
        stmt = stmt.join(cluster_t, cluster_t.c.article == article_table.c.id)
        stmt = stmt.where(cluster_t.c.cluster == cluster)

    total = count_stmt(conn, stmt, func.distinct(article_table.c.id))
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
        total=total,
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
