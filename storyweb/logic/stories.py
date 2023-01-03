import logging
from typing import Optional
from sqlalchemy.sql import select, delete, update, insert, func

from storyweb.db import Conn
from storyweb.db import story_table
from storyweb.db import story_article_table
from storyweb.logic.util import count_stmt
from storyweb.models import Story, StoryMutation, Listing, ListingResponse

log = logging.getLogger(__name__)


def list_stories(
    conn: Conn, listing: Listing, query: Optional[str], article: Optional[str]
) -> ListingResponse[Story]:
    stmt = select(story_table)
    if query is not None and len(query.strip()):
        stmt = stmt.where(story_table.c.title.ilike(f"%{query}%"))
    if article is not None and len(article.strip()):
        stmt = stmt.join(
            story_article_table,
            story_article_table.c.story == story_table.c.id,
        )
        stmt = stmt.where(story_article_table.c.article == article)
    total = count_stmt(conn, stmt, story_table.c.id)
    stmt = stmt.limit(listing.limit).offset(listing.offset)
    cursor = conn.execute(stmt)
    results = [Story.parse_obj(r) for r in cursor.fetchall()]
    return ListingResponse[Story](
        total=total,
        debug_msg=str(stmt),
        limit=listing.limit,
        offset=listing.offset,
        results=results,
    )


def fetch_story(conn: Conn, story_id: int) -> Optional[Story]:
    stmt = select(story_table)
    stmt = stmt.where(story_table.c.id == story_id)
    stmt = stmt.limit(1)
    cursor = conn.execute(stmt)
    obj = cursor.fetchone()
    if obj is None:
        return None
    return Story.parse_obj(obj)


def create_story(conn: Conn, data: StoryMutation) -> Story:
    stmt = insert(story_table)
    stmt = stmt.values(title=data.title, summary=data.summary)
    cursor = conn.execute(stmt)
    story = fetch_story(conn, cursor.inserted_primary_key[0])
    if story is None:
        raise Exception("Story was not saved.")
    return story


def update_story(conn: Conn, data: StoryMutation, story_id: int) -> Story:
    stmt = update(story_table)
    stmt = stmt.where(story_table.c.id == story_id)
    stmt = stmt.values(title=data.title, summary=data.summary)
    conn.execute(stmt)
    story = fetch_story(conn, story_id)
    if story is None:
        raise Exception("Story was not saved.")
    return story


def delete_story(conn: Conn, story_id: int) -> None:
    sa_stmt = delete(story_article_table)
    sa_stmt = sa_stmt.where(story_article_table.c.story == story_id)
    conn.execute(sa_stmt)
    s_stmt = delete(story_table)
    s_stmt = s_stmt.where(story_table.c.id == story_id)
    conn.execute(s_stmt)


def toggle_story_article(
    conn: Conn, story: int, article: str, delete_existing: bool = True
) -> None:
    t = story_article_table.alias("t")
    sstmt = select(func.count(t.c.story))
    sstmt = sstmt.filter(t.c.story == story, t.c.article == article)
    scursor = conn.execute(sstmt)
    if scursor.scalar_one() > 0:
        if delete_existing:
            dstmt = delete(t)
            dstmt = dstmt.filter(t.c.story == story, t.c.article == article)
            conn.execute(dstmt)
    else:
        istmt = insert(story_article_table)
        istmt = istmt.values(story=story, article=article)
        conn.execute(istmt)
