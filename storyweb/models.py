from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

R = TypeVar("R", bound=BaseModel)


class Response(GenericModel):
    status: str = Field("ok")
    debug_msg: Optional[str] = Field(None)


class ListingResponse(Response, Generic[R]):
    limit: int = Field()
    offset: int = Field(0)
    results: List[R]


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
    article: int


class ClusterListingResponse(ListingResponse):
    results: List[Cluster]


class RelatedCluster(BaseModel):
    id: str
    category: str
    label: str
    common_articles: int
    link_types: List[str]


class SimilarCluster(BaseModel):
    id: str
    category: str
    label: str
    common: List[str]
    common_count: int


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
