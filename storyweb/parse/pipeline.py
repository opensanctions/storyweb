import spacy
import logging
import hashlib
from spacy.tokens import Span, Doc
from pathlib import Path
from typing import Dict, Generator, List, Optional, Set, Tuple
from functools import cache
from normality import slugify
from articledata import Article
from pydantic import ValidationError

from storyweb.db import engine, Conn
from storyweb.clean import clean_entity_name, most_common, pick_name
from storyweb.models import ArticleDetails, Sentence, Tag, TagSentence
from storyweb.logic.articles import save_extracted
from storyweb.ontology import ClusterType

log = logging.getLogger(__name__)

NLP_TYPES = {
    "PERSON": ClusterType.PERSON,
    "PER": ClusterType.PERSON,
    "ORG": ClusterType.ORGANIZATION,
    "GPE": ClusterType.LOCATION,
}
NLP_MODELS = {
    "eng": "en_core_web_sm",
    # "en_core_web_trf",
    "deu": "de_core_news_sm",
    "rus": "ru_core_news_sm",
    "xxx": "xx_ent_wiki_sm",
}


@cache
def load_nlp(language: str):
    if language not in NLP_MODELS:
        return load_nlp("xxx")
    spacy.prefer_gpu()
    # disable everything but NER:
    nlp = spacy.load(
        NLP_MODELS[language],
        disable=["tok2vec", "tagger", "parser", "attribute_ruler", "lemmatizer"],
    )
    nlp.add_pipe("sentencizer")
    return nlp


def read_raw_articles(path: Path) -> Generator[Tuple[str, Article], None, None]:
    with open(path, "rb") as fh:
        while line := fh.readline():
            try:
                article = Article.parse_raw(line)
                if article.id is None:
                    continue
                if article.language != "eng":
                    continue
                yield (article.text, article)
            except ValidationError as ve:
                log.warn("Article validation [%s]: %s", article.id, ve)


def extract_tag(ent: Span) -> Optional[Tuple[str, str, str]]:
    tag_type = NLP_TYPES.get(ent.label_)
    if tag_type is None:
        return None
    label = clean_entity_name(ent.text)
    fp = slugify(label, sep="-")
    if fp is None or label is None:
        return None
    fp = "-".join(sorted(fp.split("-")))
    if tag_type == ClusterType.PERSON and " " not in label:
        return None
    return (label, tag_type, fp)


def _load_article(conn: Conn, doc: Doc, raw: Article) -> str:
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
    tag_types: Dict[str, List[str]] = {}
    tag_labels: Dict[str, List[str]] = {}
    for seq, sent in enumerate(doc.sents):
        sent_tags = 0
        for ent in sent.ents:
            extracted = extract_tag(ent)
            if extracted is None:
                continue
            (label, type_, fp) = extracted
            tag_labels.setdefault(fp, [])
            tag_labels[fp].append(label)
            tag_types.setdefault(fp, [])
            tag_types[fp].append(type_)
            tag_sentences.setdefault(fp, set())
            tag_sentences[fp].add(seq)
            sent_tags += 1

        if sent_tags > 0:
            sentence = Sentence(article=article.id, sequence=seq, text=sent.text)
            sentences.append(sentence)

    article.tags = len(tag_labels)
    article.mentions = sum([len(v) for v in tag_labels.values()])
    tags: List[Tag] = []
    tag_sentence_objs: List[TagSentence] = []
    for fp, labels in tag_labels.items():
        key = f"{article.id}>{fp}".encode("utf-8")
        tag_id = hashlib.sha1(key).hexdigest()
        type_ = most_common(tag_types[fp])
        label = pick_name(labels)
        tag = Tag(
            id=tag_id,
            cluster=tag_id,
            article=article.id,
            fingerprint=fp,
            type=type_,
            label=label,
            count=len(labels),
            frequency=float(len(labels)) / article.mentions,
            cluster_type=type_,
            cluster_label=label,
        )
        tags.append(tag)

        for seq in tag_sentences.get(fp, []):
            obj = TagSentence(tag=tag_id, article=article.id, sentence=seq)
            tag_sentence_objs.append(obj)

    save_extracted(conn, article, sentences, tag_sentence_objs, tags)
    return article.id


def load_articles(path: Path) -> None:
    nlp = load_nlp("eng")
    raw_articles = read_raw_articles(path)
    for (doc, raw_article) in nlp.pipe(raw_articles, batch_size=20, as_tuples=True):
        with engine.begin() as conn:
            _load_article(conn, doc, raw_article)


def load_one_article(conn: Conn, article: Article) -> str:
    nlp = load_nlp(article.language)
    doc = nlp(article.text)
    return _load_article(conn, doc, article)
