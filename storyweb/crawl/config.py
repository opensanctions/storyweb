from typing import List, Set
from pydantic import BaseModel
from pydantic_yaml import YamlModel


class SiteConfig(BaseModel):
    urls: Set[str]


class CrawlConfig(YamlModel):
    sites: List[SiteConfig]
