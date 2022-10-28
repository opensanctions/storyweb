import spacy
import logging
import hashlib
from spacy.tokens import Span, Doc
from pathlib import Path
from typing import Dict, Generator, List, Optional, Set, Tuple
from functools import cache
from normality import slugify
from articledata import Article as RawArticle
from pydantic import ValidationError

from storyweb.db import engine
from storyweb.clean import clean_entity_name, most_common, pick_name
from storyweb.models import Article, ArticleDetails, Sentence, Tag, TagSentence
from storyweb.logic import save_extracted
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


def extract_tag(ent: Span) -> Optional[Tuple[str, str, str]]:
    category = NLP_CATEGORIES.get(ent.label_)
    if category is None:
        return None
    label = clean_entity_name(ent.text)
    fp = slugify(label, sep="-")
    if fp is None or label is None:
        return None
    fp = "-".join(sorted(fp.split("-")))
    if category == PERSON and " " not in label:
        return None
    return (label, category, fp)


def load_article(doc: Doc, raw: RawArticle) -> None:
    log.info("Article [%s, %s]: %r", raw.id, raw.language, raw.title)
    article = ArticleDetails(
        id=raw.id,
        site=raw.site,
        url=raw.url,
        title=raw.title,
        language=raw.language,
        text=raw.text,
    )
    sentences: List[Sentence] = []
    tag_sentences: Dict[str, Set[int]] = {}
    tag_categories: Dict[str, List[str]] = {}
    tag_labels: Dict[str, List[str]] = {}
    for seq, sent in enumerate(doc.sents):
        sent_tags = 0
        for ent in sent.ents:
            extracted = extract_tag(ent)
            if extracted is None:
                continue
            (label, category, fp) = extracted
            tag_labels.setdefault(fp, [])
            tag_labels[fp].append(label)
            tag_categories.setdefault(fp, [])
            tag_categories[fp].append(category)
            tag_sentences.setdefault(fp, set())
            tag_sentences[fp].add(seq)
            sent_tags += 1

        if sent_tags > 0:
            sentence = Sentence(article=article.id, sequence=seq, text=sent.text)
            sentences.append(sentence)

    article.tags_count = len(tag_labels)
    article.tags_mentions = sum([len(v) for v in tag_labels.values()])
    tags: List[Tag] = []
    tag_sentence_objs: List[TagSentence] = []
    for fp, labels in tag_labels.items():
        key = f"{article.id}>{fp}".encode("utf-8")
        tag_id = hashlib.sha1(key).hexdigest()
        category = most_common(tag_categories[fp])
        label = pick_name(labels)
        tag = Tag(
            id=tag_id,
            cluster=tag_id,
            article=article.id,
            fingerprint=fp,
            category=category,
            label=label,
            count=len(labels),
            frequency=float(len(labels)) / article.tags_mentions,
            cluster_category=category,
            cluster_label=label,
        )
        tags.append(tag)

        for seq in tag_sentences.get(fp, []):
            obj = TagSentence(tag=tag_id, article=article.id, sentence=seq)
            tag_sentence_objs.append(obj)

    with engine.begin() as conn:
        save_extracted(conn, article, sentences, tag_sentence_objs, tags)


def load_articles(path: Path) -> None:
    nlp = load_nlp()
    raw_articles = read_raw_articles(path)
    for (doc, raw_article) in nlp.pipe(raw_articles, batch_size=20, as_tuples=True):
        load_article(doc, raw_article)
