from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Article(BaseModel):
    id: str
    site: str
    url: str
    title: Optional[str]


class Sentence(BaseModel):
    article: str
    sequence: int
    text: str


class Tag(BaseModel):
    id: str
    cluster: str
    article: str
    fingerprint: str
    category: str
    label: str
    count: int


class TagSentence(BaseModel):
    tag: str
    article: str
    sentence: int


class ArticleTag(BaseModel):
    article: Article
    id: str
    cluster: str
    category: str
    label: str
    link_type: Optional[str]
    count: Optional[int]


class LinkBase(BaseModel):
    source: str
    target: str
    type: str


class Link(LinkBase):
    source_cluster: str
    target_cluster: str
    user: Optional[str]
    timestamp: datetime


class LinkType(BaseModel):
    name: str
    directed: bool
    label: str
    phrase: str


class LinkTypes(BaseModel):
    types: List[LinkType]


class Response(BaseModel):
    status: str = Field("ok")
    debug_msg: Optional[str] = Field(None)


class ListingResponse(Response):
    limit: int = Field()
    offset: int = Field(0)


class Site(BaseModel):
    site: str
    articles: int = 0


class SiteListingResponse(ListingResponse):
    results: List[Site]


class ArticleTagListingResponse(ListingResponse):
    results: List[ArticleTag]


class LinkListingResponse(ListingResponse):
    results: List[Link]


class LinkTypeListingResponse(ListingResponse):
    results: List[LinkType]
