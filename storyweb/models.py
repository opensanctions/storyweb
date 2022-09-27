from typing import Iterable, Optional
from pydantic import BaseModel
from sqlalchemy.sql import delete

from storyweb.db import Conn, upsert
from storyweb.db import ref_table, sentence_table, tag_table


class Ref(BaseModel):
    id: str
    site: str
    url: str
    title: Optional[str]

    def save(self, conn: Conn) -> None:
        data = self.dict()
        istmt = upsert(ref_table).values([data])
        values = dict(
            site=istmt.excluded.site,
            url=istmt.excluded.url,
            title=istmt.excluded.title,
        )
        stmt = istmt.on_conflict_do_update(index_elements=["id"], set_=values)
        conn.execute(stmt)


class Sentence(BaseModel):
    ref_id: str
    sequence: int
    text: str

    @classmethod
    def save_many(self, conn: Conn, sentences: Iterable["Sentence"]) -> None:
        values = [s.dict() for s in sentences]
        if not len(values):
            return
        istmt = upsert(sentence_table).values(values)
        updates = dict(text=istmt.excluded.text)
        keys = ["ref_id", "sequence"]
        stmt = istmt.on_conflict_do_update(index_elements=keys, set_=updates)
        conn.execute(stmt)

    @classmethod
    def clear_ref(cls, conn: Conn, ref_id: str) -> None:
        stmt = delete(sentence_table)
        stmt = stmt.where(sentence_table.c.ref_id == ref_id)
        conn.execute(stmt)


class Tag(BaseModel):
    ref_id: str
    sentence: int
    key: str
    category: str
    text: str

    @classmethod
    def save_many(cls, conn: Conn, tags: Iterable["Tag"]) -> None:
        by_keys = {(t.ref_id, t.sentence, t.key): t for t in tags}
        values = [t.dict() for t in by_keys.values()]
        if not len(values):
            return
        istmt = upsert(tag_table).values(values)
        updates = dict(text=istmt.excluded.text, category=istmt.excluded.category)
        keys = ["ref_id", "sentence", "key"]
        stmt = istmt.on_conflict_do_update(index_elements=keys, set_=updates)
        conn.execute(stmt)

    @classmethod
    def clear_ref(cls, conn: Conn, ref_id: str) -> None:
        stmt = delete(tag_table)
        stmt = stmt.where(tag_table.c.ref_id == ref_id)
        conn.execute(stmt)

    # def __hash__(self):
    #     return hash(f"{self.ref_id}:{self.sentence}:{self.key}")
