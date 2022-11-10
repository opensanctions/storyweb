import click
import logging
from pathlib import Path

from storyweb.db import create_db, engine
from storyweb.logic import auto_merge, compute_cluster
from storyweb.pipeline import load_articles


log = logging.getLogger(__name__)

InPath = click.Path(dir_okay=False, readable=True, path_type=Path)


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
        # print(compute_cluster(conn, "ffd364472a999c3d1001f5910398a53997ae0afe"))
        compute_cluster(conn, "ffd364472a999c3d1001f5910398a53997ae0afe")


@cli.command("auto-merge", help="Automatically merge on fingerprints")
@click.option(
    "-f",
    "--force",
    "force",
    help="Do not check existing links",
    default=False,
    is_flag=True,
)
def auto_merge_(force: bool) -> None:
    with engine.begin() as conn:
        auto_merge(conn, check_links=force)


@cli.command("init", help="Initialize the database")
def init() -> None:
    create_db()


if __name__ == "__main__":
    cli()
