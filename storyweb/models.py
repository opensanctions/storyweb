from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Ref(BaseModel):
    id: str
    site: str
    url: str
    title: Optional[str]


class Sentence(BaseModel):
    ref_id: str
    sequence: int
    text: str


class Tag(BaseModel):
    ref_id: str
    sentence: int
    key: str
    category: str
    text: str


class Identity(BaseModel):
    key: str
    ref_id: Optional[str]
    label: Optional[str]
    category: Optional[str]
    id: str
    cluster: str
    user: Optional[str]
    timestamp: datetime


class Link(BaseModel):
    source: str
    source_cluster: str
    target: str
    target_cluster: str
    type: str
    user: Optional[str]
    timestamp: datetime

    # TYPES:
    #
    # * Same
    # * Observer
    # * Unrelated
    # * Indirect
    # * Owner
    # * Associate
    # * Family
    # * Manager
    # * Member
    # *


class Response(BaseModel):
    status: str = Field("ok")
    debug_msg: Optional[str] = Field(None)


class ListingResponse(Response):
    limit: int = Field()
    offset: int = Field(0)


class Site(BaseModel):
    site: str
    ref_count: int = 0


class SiteListingResponse(ListingResponse):
    results: List[Site]
