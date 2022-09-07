from typing import List, Optional
from pydantic import BaseModel, AnyHttpUrl, Field

# cf.:
# * https://github.com/adbar/trafilatura/blob/master/trafilatura/metadata.py
# * https://schema.org/Article


class Article(BaseModel):
    id: str
    title: str
    section: Optional[str]
    date: Optional[str]
    url: AnyHttpUrl
    tags: List[str] = []
    site: str  # e.g. "occrp"
    language: str = Field(min_length=3, max_length=3)  # 3-letter or 2-letter?
    locale: str = Field(min_length=2, max_length=10)
    bylines: List[str]
    description: Optional[str]
    lede: Optional[str]
    text: str
    extracted_at: str
