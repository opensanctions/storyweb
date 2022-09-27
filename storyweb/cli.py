import click
import logging
from pathlib import Path
from articledata import Article
from pydantic import ValidationError

from storyweb.db import create_db
from storyweb.pipeline import load_article


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
    with open(articles, "rb") as fh:
        while line := fh.readline():
            try:
                article = Article.parse_raw(line)
            except ValidationError as ve:
                log.warn("Article validation [%s]: %s", article.id, ve)

            load_article(article)


@cli.command("init", help="Initialize the database")
def init() -> None:
    create_db()


if __name__ == "__main__":
    cli()
