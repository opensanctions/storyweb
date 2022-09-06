from typing import List, Set
from pydantic import BaseModel
from pydantic_yaml import YamlModel


class SiteConfig(BaseModel):
    name: str
    urls: Set[str]


class CrawlConfig(YamlModel):
    concurrency: int = 10
    user_agent: str = "Mozilla/5.0 (storyweb)"
    sites: List[SiteConfig]
