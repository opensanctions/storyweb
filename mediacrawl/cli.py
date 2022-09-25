from typing import List
import click
import logging
import asyncio
from pathlib import Path
from functools import wraps

from mediacrawl.config import CrawlConfig
from mediacrawl.crawler import Crawler
from mediacrawl.parser import Parser
from mediacrawl.db import create_db


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
@click.option("-s", "--site", "sites", multiple=True)
@async_command
async def crawl(config: Path, sites: List[str]) -> None:
    with open(config, "r") as fh:
        config_ = CrawlConfig.parse_raw(fh.read())
    crawler = Crawler(config_)
    await crawler.run(sites=sites)


@cli.command("parse", help="Prase what has been crawled")
@click.argument("config", type=InPath)
@click.argument("outpath", type=OutDir, default="data/articles")
@click.option("-s", "--site", "sites", multiple=True)
@async_command
async def parse(config: Path, outpath: Path, sites: List[str]) -> None:
    with open(config, "r") as fh:
        config_ = CrawlConfig.parse_raw(fh.read())
    parser = Parser(config_)
    await parser.run(outpath, sites)


@cli.command("init", help="Initialize the database")
@async_command
async def init() -> None:
    await create_db()


if __name__ == "__main__":
    cli()
