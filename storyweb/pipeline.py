import spacy
from typing import List
from functools import cache
from normality import slugify
from articledata import Article

from storyweb.db import engine
from storyweb.models import Ref, Sentence, Tag

spacy.prefer_gpu()


@cache
def load_nlp():
    return spacy.load("en_core_web_trf")
    # TODO: disable everything but NER:
    # nlp = spacy.load(
    #     "en_core_web_sm",
    #     disable=["tok2vec", "tagger", "parser", "attribute_ruler", "lemmatizer"],
    # )


def load_article(article: Article) -> None:
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
            category = ent.label_
            if category not in ["PERSON", "ORG", "GPE"]:
                continue
            # print(ent.label_, ent.text)
            fp = slugify(ent.text)
            key = f"{category.lower()}:{fp}"
            tag = Tag(
                ref_id=ref.id,
                sentence=seq,
                key=key,
                category=category,
                text=ent.text,
            )
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
