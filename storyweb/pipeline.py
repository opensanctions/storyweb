import spacy
import logging
import hashlib
from spacy.tokens import Span, Doc
from pathlib import Path
from typing import Dict, Generator, List, Optional, Tuple
from functools import cache
from normality import slugify
from articledata import Article as RawArticle
from pydantic import ValidationError

from storyweb.db import engine
from storyweb.clean import clean_entity_name
from storyweb.models import Article, Sentence, Tag, TagSentence
from storyweb.logic import save_article, save_extracted
from storyweb.ontology import LOCATION, ORGANIZATION, PERSON, pick_category

log = logging.getLogger(__name__)

NLP_CATEGORIES = {
    "PERSON": PERSON,
    "PER": PERSON,
    "ORG": ORGANIZATION,
    "GPE": LOCATION,
}


@cache
def load_nlp():
    spacy.prefer_gpu()
    # disable everything but NER:
    nlp = spacy.load(
        # "en_core_web_trf",
        "en_core_web_sm",
        disable=["tok2vec", "tagger", "parser", "attribute_ruler", "lemmatizer"],
    )
    nlp.add_pipe("sentencizer")
    return nlp


def read_raw_articles(path: Path) -> Generator[Tuple[str, RawArticle], None, None]:
    with open(path, "rb") as fh:
        while line := fh.readline():
            try:
                article = RawArticle.parse_raw(line)
                if article.id is None:
                    continue
                if article.language != "eng":
                    continue
                yield (article.text, article)
            except ValidationError as ve:
                log.warn("Article validation [%s]: %s", article.id, ve)


def extract_tag(article_id: str, ent: Span) -> Optional[Tuple[str, str, str, str]]:
    category = NLP_CATEGORIES.get(ent.label_)
    if category is None:
        return None
    label = clean_entity_name(ent.text)
    fp = slugify(label, sep="-")
    if fp is None:
        return None
    fp = "-".join(sorted(fp.split("-")))
    if category == PERSON and " " not in label:
        return None
    key = f"{article_id}.{fp}".encode("utf-8")
    id = hashlib.sha1(key).hexdigest()
    return (id, label, category, fp)


def load_article(doc: Doc, raw: RawArticle) -> None:
    log.info("Article [%s, %s]: %r", raw.id, raw.language, raw.title)
    article = Article(
        id=raw.id,
        site=raw.site,
        url=raw.url,
        title=raw.title,
    )
    sentences: List[Sentence] = []
    tags: Dict[str, Tag] = {}
    tag_sentences: Dict[int, TagSentence] = {}
    # tag_categories: Dict[str, ]
    for seq, sent in enumerate(doc.sents):
        sent_tags = 0
        for ent in sent.ents:
            extracted = extract_tag(article.id, ent)
            if extracted is None:
                continue
            (tag_id, label, category, fp) = extracted
            if tag_id not in tags:
                tags[tag_id] = Tag(
                    id=tag_id,
                    cluster=tag_id,
                    article=article.id,
                    fingerprint=fp,
                    category=category,
                    label=label,
                    count=1,
                )
            else:
                # TODO figure out categories
                categories = [category, tags[tag_id].category]
                try:
                    tags[tag_id].category = pick_category(categories)
                except TypeError:
                    pass
                tags[tag_id].count += 1

            # log.info("Tag: %r", tags[tag_id])

            tag_sentence = TagSentence(tag=tag_id, article=article.id, sentence=seq)
            tag_sentences[seq] = tag_sentence
            sent_tags += 1

        if sent_tags > 0:
            sentence = Sentence(article=article.id, sequence=seq, text=sent.text)
            sentences.append(sentence)

    with engine.begin() as conn:
        save_extracted(conn, article, sentences, tag_sentences.values(), tags.values())


def load_articles(path: Path) -> None:
    nlp = load_nlp()
    raw_articles = read_raw_articles(path)
    for (doc, raw_article) in nlp.pipe(raw_articles, batch_size=20, as_tuples=True):
        load_article(doc, raw_article)
