import json
import asyncio
import trafilatura
from datetime import datetime
from typing import Optional
import aiohttp
from lxml import html
from urllib.parse import urlparse, urljoin
from sqlmodel import Field, Session, SQLModel, create_engine, select


queue = asyncio.Queue()
seen = set()
engine = create_engine("sqlite:///crawl.sqlite3")


class Page(SQLModel, table=True):
    url: Optional[str] = Field(primary_key=True)
    text: Optional[str]
    is_article: bool
    crawled_at: datetime


class Article(SQLModel, table=True):
    url: Optional[str] = Field(primary_key=True)
    title: Optional[str]
    author: Optional[str]
    date: Optional[str]
    text: Optional[str]


async def clean_url(url):
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return
    if parsed.hostname not in ["occrp.org", "www.occrp.org"]:
        return None
    if parsed.path.startswith("/ru/"):
        return None
    parsed = parsed._replace(query=None)
    parsed = parsed._replace(fragment=None)
    url = parsed.geturl()
    return url


async def crawl_url(url):
    url = await clean_url(url)
    if url is None:
        return
    if url in seen:
        return
    seen.add(url)
    await queue.put(url)


async def get_page(db: Session, session: aiohttp.ClientSession, url: str):
    statement = select(Page).where(Page.url == url)
    page = db.exec(statement).first()
    if page is not None:
        return page

    async with session.get(url) as response:
        content_type = response.headers.get("Content-Type")
        text = None
        if response.status == 200:
            if content_type is None or "html" in content_type.lower():
                # print("CONTENT_TYPE", content_type)
                data = await response.read()
                # print("FETCHED", url, response.headers.get("Content-Type"))
                try:
                    text = data.decode("utf-8")
                except UnicodeDecodeError as exc:
                    # text = None
                    pass
        page = Page(
            url=url,
            text=text,
            is_article=False,
            crawled_at=datetime.utcnow(),
        )
        db.add(page)
        db.commit()
        return page


def is_article(doc):
    if doc.find('.//article//li[@class="authors"]') is not None:
        return True
    if doc.find('.//aside[@class="byline"]') is not None:
        return True
    if doc.find('.//section[@class="blog"]') is not None:
        return True
    if doc.find('.//div[@class="occrp-story"]') is not None:
        return True
    return False


async def extract_article(db: Session, page: Page, doc):
    extract = trafilatura.bare_extraction(doc)
    statement = select(Article).where(Article.url == page.url)
    article = db.exec(statement).first()
    if article is None:
        article = Article(url=page.url)
    title = extract.get("title")
    if title is not None:
        title = title.replace(" - OCCRP", "")
        article.title = title.strip()
    article.date = extract.get("date")
    article.text = extract.get("text")
    article.author = extract.get("author")
    # print(list(extract.keys()))
    print("ARTICLE", page.url, extract.get("title"))
    db.add(article)
    db.commit()


async def worker(session: aiohttp.ClientSession):
    while True:
        with Session(engine) as db:
            url = await queue.get()
            try:
                page = await get_page(db, session, url)
                if page is not None and page.text is not None:
                    doc = html.fromstring(page.text)
                    # article = trafilatura.bare_extraction(doc)
                    # print(article)
                    for link in doc.findall(".//a"):
                        next_url = link.get("href")
                        if next_url is None:
                            continue
                        next_url = urljoin(url, next_url)
                        await crawl_url(next_url)
                        # print(link)
                    if is_article(doc):
                        await extract_article(db, page, doc)
                    # print("NO ARTICLE", url)
                    # print(url, doc, queue.qsize())

            except Exception as exc:
                print("EXCEPTION", exc)
            queue.task_done()


async def crawl():
    SQLModel.metadata.create_all(engine)
    headers = {"User-Agent": "pudo from the hood"}
    async with aiohttp.ClientSession(headers=headers) as session:
        await crawl_url("https://occrp.org")
        tasks = []
        for _ in range(10):
            task = asyncio.create_task(worker(session))
            tasks.append(task)

        await queue.join()
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


async def export():
    with open("articles.json", "w") as fh:
        with Session(engine) as db:
            statement = select(Article)
            articles = db.exec(statement).all()
            data = [a.dict() for a in articles]
            json.dump(data, fh)


def main():
    asyncio.run(export())


if __name__ == "__main__":
    main()
