from sqlalchemy import MetaData, create_engine
from sqlalchemy import Table, Column, Integer, Unicode, DateTime
from sqlalchemy.engine import Connection
from sqlalchemy.dialects.postgresql import insert as upsert

from storyweb import settings

Conn = Connection

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
    Column("id", Unicode(255), primary_key=True),
    Column("cluster", Unicode(255), index=True),
    Column("article", Unicode(255)),
    Column("fingerprint", Unicode(1024)),
    Column("category", Unicode(255)),
    Column("label", Unicode),
    Column("count", Integer),
)

tag_sentence_table = Table(
    "tag_sentence",
    meta,
    Column("article", Unicode(255), primary_key=True),
    Column("sentence", Integer, primary_key=True),
    Column("tag", Unicode(255), primary_key=True),
)

identity_table = Table(
    "identity",
    meta,
    Column("key", Unicode(1024), primary_key=True),
    Column("ref_id", Unicode(255), nullable=True, primary_key=True),
    Column("label", Unicode(1024), nullable=True),
    Column("category", Unicode(255), nullable=True),
    Column("id", Unicode(255)),
    Column("cluster", Unicode(255)),
    Column("user", Unicode(255), nullable=True),
    Column("timestamp", DateTime),
)

link_table = Table(
    "link",
    meta,
    Column("source", Unicode(255), primary_key=True),
    Column("source_cluster", Unicode(255)),
    Column("target", Unicode(255), primary_key=True),
    Column("target_cluster", Unicode(255)),
    Column("type", Unicode(255)),
    Column("user", Unicode(255), nullable=True),
    Column("timestamp", DateTime),
)
