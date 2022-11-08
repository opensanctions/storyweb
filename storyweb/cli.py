import click
import logging
from pathlib import Path

from storyweb.db import create_db, engine
from storyweb.logic import auto_merge, compute_idf
from storyweb.pipeline import load_articles


log = logging.getLogger(__name__)

InPath = click.Path(dir_okay=False, readable=True, path_type=Path)
# OutPath = click.Path(dir_okay=False, writable=True, path_type=Path)
# OutDir = click.Path(dir_okay=True, path_type=Path, file_okay=False)


@click.group(help="Storyweb CLI")
def cli() -> None:
    logging.basicConfig(level=logging.INFO)


@cli.command("import", help="Import articles into the DB")
@click.argument("articles", type=InPath)
def parse(articles: Path) -> None:
    load_articles(articles)


@cli.command("compute", help="Run backend computations")
def compute() -> None:
    with engine.begin() as conn:
        compute_idf(conn)


@cli.command("auto-merge", help="Automatically merge on fingerprints")
def auto_merge_() -> None:
    with engine.begin() as conn:
        auto_merge(conn)


@cli.command("init", help="Initialize the database")
def init() -> None:
    create_db()


if __name__ == "__main__":
    cli()
