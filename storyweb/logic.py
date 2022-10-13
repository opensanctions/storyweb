from uuid import uuid4
from datetime import datetime
from typing import Iterable, List, Optional, Set
from sqlalchemy.sql import select, delete, update, insert, func, and_, or_

from storyweb.db import Conn, upsert
from storyweb.db import article_table, identity_table, sentence_table
from storyweb.db import tag_table, link_table, tag_sentence_table
from storyweb.links import link_types
from storyweb.clean import most_common, pick_name
from storyweb.models import (
    Identity,
    Link,
    Article,
    ArticleTag,
    ArticleTagListingResponse,
    Sentence,
    Site,
    Tag,
    TagSentence,
)


def list_sites(conn: Conn) -> List[Site]:
    stmt = select(
        article_table.c.site,
        func.count(article_table.c.id).label("ref_count"),
    )
    stmt = stmt.group_by(article_table.c.site)
    stmt = stmt.order_by(article_table.c.site)
    cursor = conn.execute(stmt)
    return [Site.parse_obj(r) for r in cursor.fetchall()]


def list_tags(
    conn: Conn,
    sites: List[str] = [],
    query: Optional[str] = None,
    coref: str = None,
    coref_linked: Optional[bool] = None,
) -> ArticleTagListingResponse:
    tag_t = tag_table.alias("t")
    ref_t = article_table.alias("r")
    id_t = identity_table.alias("i")
    coref_t = identity_table.alias("coref")
    link_t = link_table.alias("link_in")
    # link_out_t = link_table.alias("link_out")
    stmt = select(
        ref_t.c.id.label("ref_id"),
        ref_t.c.title.label("ref_title"),
        ref_t.c.url.label("ref_url"),
        ref_t.c.site.label("ref_site"),
        tag_t.c.key.label("key"),
        func.max(id_t.c.cluster).label("cluster"),
        func.array_agg(tag_t.c.text).label("texts"),
        func.array_agg(tag_t.c.category).label("categories"),
        func.count(tag_t.c.sentence).label("count"),
    )
    stmt = stmt.outerjoin(
        id_t, and_(id_t.c.ref_id == tag_t.c.ref_id, id_t.c.key == tag_t.c.key)
    )
    if len(sites):
        stmt = stmt.filter(ref_t.c.site.in_(sites))
    if query is not None and len(query.strip()):
        stmt = stmt.filter(tag_t.c.text.ilike(f"%{query}%"))

    stmt = stmt.join(ref_t, ref_t.c.id == tag_t.c.ref_id)
    if coref is not None:
        clause_occur = and_(
            coref_t.c.ref_id == ref_t.c.id,
            coref_t.c.cluster == coref,
            coref_t.c.key != tag_t.c.key,
        )
        clause_alias = and_(
            coref_t.c.key == tag_t.c.key,
            coref_t.c.id == coref,
            # coref_t.c.cluster != id_t.c.cluster,
        )
        # stmt = stmt.where(or_(clause_occur, clause_alias))
        stmt = stmt.where(or_(clause_occur))

        link_in = and_(
            link_t.c.target_cluster == coref,
            link_t.c.source_cluster == id_t.c.cluster,
        )
        link_out = and_(
            link_t.c.source_cluster == coref,
            link_t.c.target_cluster == id_t.c.cluster,
        )

        stmt = stmt.outerjoin(link_t, or_(link_in, link_out))
        if coref_linked is True:
            stmt = stmt.where(link_t.c.type != None)
        if coref_linked is False:
            stmt = stmt.where(link_t.c.type == None)

        stmt = stmt.add_columns(func.array_agg(link_t.c.type).label("link_types"))

    stmt = stmt.group_by(ref_t.c.id, tag_t.c.key)
    stmt = stmt.order_by(func.count(tag_t.c.sentence).desc())
    stmt = stmt.limit(100)
    cursor = conn.execute(stmt)
    response = ArticleTagListingResponse(limit=100, offset=0, results=[])
    response.debug_msg = str(stmt)
    for row in cursor.fetchall():
        ref = Article(
            id=row["ref_id"],
            site=row["ref_site"],
            url=row["ref_url"],
            title=row["ref_title"],
        )
        link_type = None
        if "link_types" in row:
            link_type = most_common(row["link_types"])
        reftag = ArticleTag(
            ref=ref,
            key=row["key"],
            cluster=row["cluster"],
            count=row["count"],
            link_type=link_type,
            category=most_common(row["categories"]),
            text=pick_name(row["texts"]),
        )
        response.results.append(reftag)
    return response


def list_links(conn: Conn, identities: List[str]) -> List[Link]:
    link_t = link_table.alias("l")
    stmt = select(link_t)
    for idx, identity in enumerate(identities):
        id_t = identity_table.alias(f"id_${idx}")
        stmt = stmt.filter(id_t.c.id == identity)
        stmt = stmt.filter(
            or_(
                id_t.c.cluster == link_t.c.source_cluster,
                id_t.c.cluster == link_t.c.target_cluster,
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
    referents = get_cluster(conn, id)
    cluster = max(referents)
    stmt = update(identity_table)
    stmt = stmt.where(identity_table.c.id.in_(referents))
    stmt = stmt.where(identity_table.c.cluster != cluster)
    stmt = stmt.values(cluster=cluster)
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


def get_cluster(conn: Conn, id: str) -> Set[str]:
    link_t = link_table.alias("l")
    target = link_t.c.target
    source = link_t.c.source
    type_c = link_t.c.type
    same_as = link_types.SAME.name
    stmt_t = select(target.label("node"))
    stmt_t = stmt_t.where(source == id, type_c == same_as)
    stmt_s = select(source.label("node"))
    stmt_s = stmt_s.where(target == id, type_c == same_as)
    cte = stmt_t.cte("connected", recursive=True)
    cte_alias = cte.alias("c")
    # stmt_rs = select(source.label("node"))
    # stmt_rs = stmt_rs.join(cte_alias, cte_alias.c.node == target)
    # stmt_rs = stmt_rs.where(type_c == same_as)
    stmt_rt = select(target.label("node"))
    stmt_rt = stmt_rt.join(cte_alias, cte_alias.c.node == source)
    stmt_rt = stmt_rt.where(type_c == same_as)
    cte = cte.union(stmt_s, stmt_rt)  # type: ignore

    stmt = select(cte.c.node)
    # print(stmt)
    connected = set([id])
    for row in conn.execute(stmt).fetchall():
        connected.add(row.node)
    return connected


def get_identity_by_ref_key(conn: Conn, ref_id: str, key: str) -> Optional[Identity]:
    stmt = select(identity_table)
    stmt = stmt.where(identity_table.c.ref_id == ref_id)
    stmt = stmt.where(identity_table.c.key == key)
    stmt = stmt.limit(1)
    cursor = conn.execute(stmt)
    for row in cursor.fetchall():
        return Identity.parse_obj(row)
    return None


def get_identity_by_id(conn: Conn, id: str) -> Optional[Identity]:
    # TODO: should this do an OR on cluster ID?
    stmt = select(identity_table)
    stmt = stmt.where(identity_table.c.id == id)
    stmt = stmt.limit(1)
    cursor = conn.execute(stmt)
    for row in cursor.fetchall():
        return Identity.parse_obj(row)
    return None


def list_identity_tags(conn: Conn, cluster: str) -> List[Tag]:
    # Get all the parts of a clustered identity
    id_t = identity_table.alias("i")
    tag_t = tag_table.alias("t")
    stmt = select(tag_t)
    join_cond = and_(tag_t.c.ref_id == id_t.c.ref_id, tag_t.c.key == id_t.c.key)
    stmt = stmt.join(id_t, join_cond)
    stmt = stmt.where(id_t.c.cluster == cluster)
    cursor = conn.execute(stmt)
    return [Tag.parse_obj(r) for r in cursor.fetchall()]


def create_identity(
    conn: Conn,
    key: str,
    ref_id: Optional[str],
    label: Optional[str] = None,
    category: Optional[str] = None,
    user: Optional[str] = None,
) -> Identity:
    # TODO: make this into upsert save()?
    id = uuid4().hex
    obj = Identity(
        id=id,
        cluster=id,
        key=key,
        ref_id=ref_id,
        label=label,
        category=category,
        user=user,
        timestamp=datetime.utcnow(),
    )
    save_identity(conn, obj)
    return obj


def save_identity(conn: Conn, identity: Identity) -> None:
    istmt = upsert(identity_table).values(identity.dict())
    values = dict(
        label=istmt.excluded.label,
        category=istmt.excluded.category,
        cluster=istmt.excluded.cluster,
    )
    stmt = istmt.on_conflict_do_update(index_elements=["key", "ref_id"], set_=values)
    conn.execute(stmt)
    # TODO: needed?
    update_cluster(conn, identity.id)


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
