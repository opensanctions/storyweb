from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

R = TypeVar("R", bound=BaseModel)


class Response(GenericModel):
    status: str = Field("ok")
    debug_msg: Optional[str] = Field(None)


class ListingResponse(Response, Generic[R]):
    total: int = Field(0)
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
    language: Optional[str]
    tags: Optional[int]
    mentions: Optional[int]


class ArticleDetails(Article):
    text: str


class StoryCreate(BaseModel):
    title: str


class Story(BaseModel):
    id: int
    title: str


class Sentence(BaseModel):
    article: str
    sequence: int
    text: str


class ClusterBase(BaseModel):
    id: str
    type: str
    label: str


class Tag(ClusterBase):
    cluster: str
    article: str
    fingerprint: str
    count: int
    frequency: float
    cluster_type: Optional[str]
    cluster_label: Optional[str]


class TagSentence(BaseModel):
    tag: str
    article: str
    sentence: int


class Cluster(ClusterBase):
    articles: int


class ClusterDetails(Cluster):
    labels: List[str]


class RelatedCluster(ClusterBase):
    articles: int
    link_types: List[str] = []


class SimilarCluster(ClusterBase):
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


class MergeRequest(BaseModel):
    anchor: str
    other: List[str]


class ExplodeRequest(BaseModel):
    cluster: str


class UntagRequest(BaseModel):
    cluster: str
    article: str


class Site(BaseModel):
    site: str
    articles: int = 0
