from typing import List, Optional, Set
from pydantic import BaseModel
from pydantic_yaml import YamlModel

from storyweb.crawl.rule import Rules


class SiteConfig(BaseModel):
    name: str
    urls: Set[str]
    crawl: Optional[Rules]
    parse: Optional[Rules]


class CrawlConfig(YamlModel):
    concurrency: int = 100
    user_agent: str = "Mozilla/5.0 (storyweb)"
    sites: List[SiteConfig]
