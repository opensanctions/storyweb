import click
import logging
from pathlib import Path
from networkx.readwrite.gexf import write_gexf

from storyweb.db import create_db, engine
from storyweb.logic.links import compute_cluster, auto_merge
from storyweb.logic.graph import generate_graph
from storyweb.parse import import_article_by_url
from storyweb.parse.pipeline import load_articles


log = logging.getLogger(__name__)

InPath = click.Path(dir_okay=False, readable=True, path_type=Path)
OutPath = click.Path(dir_okay=False, readable=True, path_type=Path)


@click.group(help="Storyweb CLI")
def cli() -> None:
    logging.basicConfig(level=logging.INFO)


@cli.command("import", help="Import articles into the DB")
@click.argument("articles", type=InPath)
def parse(articles: Path) -> None:
    load_articles(articles)


@cli.command("import-url", help="Load a single news story by URL")
@click.argument("url", type=str)
def parse(url: str) -> None:
    import_article_by_url(url)


@cli.command("graph", help="Export an entity graph")
@click.argument("graph_path", type=OutPath)
def export_graph(graph_path: Path) -> None:
    with engine.begin() as conn:
        graph = generate_graph(conn)
        write_gexf(graph, graph_path)


@cli.command("compute", help="Run backend computations")
def compute() -> None:
    from pprint import pprint
    from storyweb.models import Listing
    from storyweb.logic.clusters import list_story_pairs

    with engine.begin() as conn:
        # print(compute_cluster(conn, "ffd364472a999c3d1001f5910398a53997ae0afe"))
        listing = Listing(limit=5, offset=0, sort_direction="desc")
        resp = list_story_pairs(conn, listing, 4)
        pprint(resp.dict())


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
