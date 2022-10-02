from datetime import datetime
from typing import Iterable, List, Optional
from uuid import uuid4
from sqlalchemy.sql import select, delete, func, and_
from storyweb.clean import most_common, pick_name

from storyweb.db import Conn, upsert
from storyweb.db import ref_table, identity_table, sentence_table, tag_table
from storyweb.models import (
    Identity,
    Ref,
    RefTag,
    RefTagListingResponse,
    Sentence,
    Site,
    Tag,
)


def list_sites(conn: Conn) -> List[Site]:
    stmt = select(ref_table.c.site, func.count(ref_table.c.id).label("ref_count"))
    stmt = stmt.group_by(ref_table.c.site)
    stmt = stmt.order_by(ref_table.c.site)
    cursor = conn.execute(stmt)
    return [Site.parse_obj(r) for r in cursor.fetchall()]


def list_tags(
    conn: Conn, sites: List[str] = [], q: Optional[str] = None
) -> RefTagListingResponse:
    tag_t = tag_table.alias("t")
    ref_t = ref_table.alias("r")
    id_t = identity_table.alias("i")
    stmt = select(
        ref_t.c.id.label("ref_id"),
        ref_t.c.title.label("ref_title"),
        ref_t.c.url.label("ref_url"),
        ref_t.c.site.label("ref_site"),
        tag_t.c.key.label("key"),
        func.array_agg(tag_t.c.text).label("texts"),
        func.array_agg(tag_t.c.category).label("categories"),
        func.count(tag_t.c.sentence).label("count"),
    )
    stmt = stmt.join(ref_t, ref_t.c.id == tag_t.c.ref_id)
    stmt = stmt.outerjoin(
        id_t, and_(id_t.c.ref_id == tag_t.c.ref_id, id_t.c.key == tag_t.c.key)
    )
    stmt = stmt.group_by(ref_t.c.id, tag_t.c.key)
    stmt = stmt.order_by(func.count(tag_t.c.sentence).desc())
    stmt = stmt.limit(100)
    cursor = conn.execute(stmt)
    response = RefTagListingResponse(limit=100, offset=0, results=[])
    for row in cursor.fetchall():
        ref = Ref(
            id=row["ref_id"],
            site=row["ref_site"],
            url=row["ref_url"],
            title=row["ref_title"],
        )
        reftag = RefTag(
            ref=ref,
            key=row["key"],
            count=row["count"],
            category=most_common(row["categories"]),
            text=pick_name(row["texts"]),
        )
        response.results.append(reftag)
    return response


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


def build_cluster_mapping(cls):
    pass
    # TODO: compute connected components on clusters
    # generate a mapping table, or maybe a materialised view
    # update identity and link tables from mapping table


def save_ref(conn: Conn, ref: Ref) -> None:
    istmt = upsert(ref_table).values([ref.dict()])
    values = dict(
        site=istmt.excluded.site,
        url=istmt.excluded.url,
        title=istmt.excluded.title,
    )
    stmt = istmt.on_conflict_do_update(index_elements=["id"], set_=values)
    conn.execute(stmt)


def save_sentences(conn: Conn, sentences: Iterable[Sentence]) -> None:
    values = [s.dict() for s in sentences]
    if not len(values):
        return
    istmt = upsert(sentence_table).values(values)
    updates = dict(text=istmt.excluded.text)
    keys = ["ref_id", "sequence"]
    stmt = istmt.on_conflict_do_update(index_elements=keys, set_=updates)
    conn.execute(stmt)


def save_tags(conn: Conn, tags: Iterable[Tag]) -> None:
    by_keys = {(t.ref_id, t.sentence, t.key): t for t in tags}
    values = [t.dict() for t in by_keys.values()]
    if not len(values):
        return
    istmt = upsert(tag_table).values(values)
    updates = dict(text=istmt.excluded.text, category=istmt.excluded.category)
    keys = ["ref_id", "sentence", "key"]
    stmt = istmt.on_conflict_do_update(index_elements=keys, set_=updates)
    conn.execute(stmt)


def clear_ref(conn: Conn, ref_id: str) -> None:
    stmt = delete(sentence_table)
    stmt = stmt.where(sentence_table.c.ref_id == ref_id)
    conn.execute(stmt)

    stmt = delete(tag_table)
    stmt = stmt.where(tag_table.c.ref_id == ref_id)
    conn.execute(stmt)
