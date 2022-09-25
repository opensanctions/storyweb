from typing import List, Optional, Set
from pydantic import BaseModel, validator
from pydantic_yaml import YamlModel

from storyweb.crawl.rule import Rules
from storyweb.crawl.url import URL


class SiteConfig(BaseModel):
    name: str
    delay: float = 0.0
    domain_concurrency: int = 10
    urls: Set[URL]
    crawl: Optional[Rules]
    parse: Optional[Rules]

    @validator("urls", each_item=True)
    def convert_url(cls, url: Optional[str]) -> Optional[URL]:
        if url is None:
            return None
        return URL(url)


class CrawlConfig(YamlModel):
    concurrency: int = 100
    user_agent: str = "Mozilla/5.0 (storyweb)"
    sites: List[SiteConfig]
