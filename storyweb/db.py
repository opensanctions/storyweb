from sqlalchemy import MetaData, create_engine
from sqlalchemy import Table, Column, Integer, Unicode, DateTime, Float
from sqlalchemy.engine import Connection
from sqlalchemy.dialects.postgresql import insert as upsert

from storyweb import settings

Conn = Connection
KEY_LEN = 40

engine = create_engine(settings.DB_URL)
meta = MetaData(bind=engine)

__all__ = ["Conn", "upsert", "create_db"]


def create_db() -> None:
    meta.create_all(checkfirst=True)


article_table = Table(
    "article",
    meta,
    Column("id", Unicode(255), primary_key=True),
    Column("site", Unicode(255), index=True, nullable=False),
    Column("url", Unicode, nullable=True),
    Column("title", Unicode, nullable=True),
    Column("tags_count", Integer, default=0),
    Column("tags_mentions", Integer, default=0),
)

sentence_table = Table(
    "sentence",
    meta,
    Column("article", Unicode(255), primary_key=True),
    Column("sequence", Integer, primary_key=True),
    Column("text", Unicode),
)

tag_table = Table(
    "tag",
    meta,
    Column("id", Unicode(KEY_LEN), primary_key=True),
    Column("cluster", Unicode(KEY_LEN), index=True),
    Column("article", Unicode(255), index=True),
    Column("fingerprint", Unicode(1024), index=True),
    Column("category", Unicode(10)),
    Column("label", Unicode),
    Column("count", Integer),
    Column("frequency", Float),
    Column("cluster_category", Unicode(10)),
    Column("cluster_label", Unicode),
)

tag_sentence_table = Table(
    "tag_sentence",
    meta,
    Column("article", Unicode(255), primary_key=True),
    Column("sentence", Integer, primary_key=True),
    Column("tag", Unicode(KEY_LEN), primary_key=True),
)

fingerprint_idf_table = Table(
    "fingerprint_idf",
    meta,
    Column("fingerprint", Unicode(1024), index=True),
    Column("frequency", Float),
)

link_table = Table(
    "link",
    meta,
    Column("source", Unicode(KEY_LEN), primary_key=True),
    Column("source_cluster", Unicode(KEY_LEN)),
    Column("target", Unicode(KEY_LEN), primary_key=True),
    Column("target_cluster", Unicode(KEY_LEN)),
    Column("type", Unicode(255)),
    Column("user", Unicode(255), nullable=True),
    Column("timestamp", DateTime),
)
