import spacy
import logging
from spacy.tokens import Span, Doc
from pathlib import Path
from typing import Generator, List, Optional, Tuple
from functools import cache
from normality import slugify
from articledata import Article as ArticleFormat
from pydantic import ValidationError

from storyweb.db import engine
from storyweb.clean import clean_entity_name
from storyweb.models import Ref, Sentence, Tag
from storyweb.logic import save_ref, clear_ref, save_sentences, save_tags
from storyweb.ontology import LOCATION, ORGANIZATION, PERSON

log = logging.getLogger(__name__)

NLP_CATEGORIES = {"PERSON": PERSON, "PER": PERSON, "ORG": ORGANIZATION, "GPE": LOCATION}


@cache
def load_nlp():
    # spacy.prefer_gpu()
    # disable everything but NER:
    nlp = spacy.load(
        "en_core_web_trf",
        # "en_core_web_sm",
        disable=["tok2vec", "tagger", "parser", "attribute_ruler", "lemmatizer"],
    )
    nlp.add_pipe("sentencizer")
    return nlp


def read_articles(path: Path) -> Generator[Tuple[str, ArticleFormat], None, None]:
    with open(path, "rb") as fh:
        while line := fh.readline():
            try:
                article = ArticleFormat.parse_raw(line)
                if article.id is None:
                    continue
                if article.language != "eng":
                    continue
                yield (article.text, article)
            except ValidationError as ve:
                log.warn("Article validation [%s]: %s", article.id, ve)


def make_tag(ref_id: str, seq: int, ent: Span) -> Optional[Tag]:
    category = NLP_CATEGORIES.get(ent.label_)
    if category is None:
        return None
    text = clean_entity_name(ent.text)
    fp = slugify(text, sep="-")
    if fp is None:
        return None
    fp = "-".join(sorted(fp.split("-")))
    if category == "PERSON" and " " not in text:
        return None
    key = f"{category.lower()}:{fp}"
    return Tag(
        ref_id=ref_id,
        sentence=seq,
        key=key,
        category=category,
        text=text,
    )


def load_article(doc: Doc, article: ArticleFormat) -> None:
    print(article.language, article.id)
    ref = Ref(
        id=article.id,
        site=article.site,
        url=article.url,
        title=article.title,
    )

    sentences: List[Sentence] = []
    tags: List[Tag] = []
    for seq, sent in enumerate(doc.sents):
        sent_tags = 0
        for ent in sent.ents:
            tag = make_tag(ref.id, seq, ent)
            if tag is not None:
                tags.append(tag)
                sent_tags += 1

        if sent_tags > 0:
            sentence = Sentence(ref_id=ref.id, sequence=seq, text=sent.text)
            sentences.append(sentence)

    with engine.begin() as conn:
        save_ref(conn, ref)
        clear_ref(conn, ref.id)
        save_sentences(conn, sentences)
        save_tags(conn, tags)


def load_articles(path: Path) -> None:
    nlp = load_nlp()
    articles = read_articles(path)
    for (doc, article) in nlp.pipe(articles, batch_size=20, as_tuples=True):
        load_article(doc, article)
