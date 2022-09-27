import spacy
from spacy.tokens import Span
from typing import List, Optional
from functools import cache
from normality import slugify
from articledata import Article
from storyweb.clean import clean_entity_name

from storyweb.db import engine
from storyweb.models import Ref, Sentence, Tag

# spacy.prefer_gpu()


@cache
def load_nlp():
    return spacy.load("en_core_web_trf")
    # TODO: disable everything but NER:
    # nlp = spacy.load(
    #     "en_core_web_sm",
    #     disable=["tok2vec", "tagger", "parser", "attribute_ruler", "lemmatizer"],
    # )


def make_tag(ref_id: str, seq: int, ent: Span) -> Optional[Tag]:
    category = ent.label_
    if category not in ["PERSON", "ORG", "GPE"]:
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


def load_article(article: Article) -> None:
    if article.id is None:
        return
    if article.language != "eng":
        return
    nlp = load_nlp()
    doc = nlp(article.text)
    print(article.language, article.id)
    ref = Ref(id=article.id, site=article.site, url=article.url, title=article.title)

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
        ref.save(conn)
        Sentence.clear_ref(conn, ref.id)
        Tag.clear_ref(conn, ref.id)
        Sentence.save_many(conn, sentences)
        Tag.save_many(conn, tags)
