from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Response(BaseModel):
    status: str = Field("ok")
    debug_msg: Optional[str] = Field(None)


class ListingResponse(Response):
    limit: int = Field()
    offset: int = Field(0)


class Listing(BaseModel):
    limit: int
    offset: int
    sort_direction: str
    sort_field: Optional[str]


class Article(BaseModel):
    id: str
    site: str
    url: str
    title: Optional[str]
    tags_count: Optional[int]
    tags_mentions: Optional[int]


class ArticleListingResponse(ListingResponse):
    results: List[Article]


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
    frequency: float
    cluster_category: Optional[str]
    cluster_label: Optional[str]


class TagSentence(BaseModel):
    tag: str
    article: str
    sentence: int


class ArticleTag(BaseModel):
    article: Article
    id: str
    cluster: str
    fingerprint: str
    category: str
    label: str
    count: int


class ArticleTagListingResponse(ListingResponse):
    results: List[ArticleTag]


class Cluster(BaseModel):
    id: str
    category: str
    label: str
    link_type: Optional[str]
    count: int
    tags: int


class ClusterListingResponse(ListingResponse):
    results: List[Cluster]


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


class LinkListingResponse(ListingResponse):
    results: List[Link]


class LinkTypes(BaseModel):
    types: List[LinkType]


class LinkTypeListingResponse(ListingResponse):
    results: List[LinkType]


class Site(BaseModel):
    site: str
    articles: int = 0


class SiteListingResponse(ListingResponse):
    results: List[Site]
