import click
import logging
import asyncio
from pathlib import Path
from functools import wraps

from storyweb.crawl import CrawlConfig
from storyweb.crawl.crawler import Crawler
from storyweb.parse import Parser
from storyweb.db import create_db


log = logging.getLogger(__name__)

InPath = click.Path(dir_okay=False, readable=True, path_type=Path)
OutPath = click.Path(dir_okay=False, writable=True, path_type=Path)
OutDir = click.Path(dir_okay=True, path_type=Path, file_okay=False)


def async_command(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))

    return wrapper


@click.group(help="Storyweb CLI")
def cli() -> None:
    logging.basicConfig(level=logging.INFO)


@cli.command("crawl", help="Crawl the news")
@click.argument("config", type=InPath)
@async_command
async def crawl(config: Path) -> None:
    with open(config, "r") as fh:
        config_ = CrawlConfig.parse_raw(fh.read())
    crawler = Crawler(config_)
    await crawler.run()


@cli.command("parse", help="Prase what has been crawled")
@click.argument("config", type=InPath)
@click.argument("outpath", type=OutDir, default="data/articles")
@async_command
async def parse(config: Path, outpath: Path) -> None:
    with open(config, "r") as fh:
        config_ = CrawlConfig.parse_raw(fh.read())
    parser = Parser(config_)
    await parser.run()


@cli.command("init", help="Initialize the database")
@async_command
async def init() -> None:
    await create_db()


if __name__ == "__main__":
    cli()
