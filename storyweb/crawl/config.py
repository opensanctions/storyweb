from typing import List, Optional, Set
from pydantic import BaseModel
from pydantic_yaml import YamlModel

from storyweb.crawl.ruledantic import Rules


class SiteConfig(BaseModel):
    name: str
    urls: Set[str]
    include: Optional[Rules]
    exclude: Optional[Rules]


class CrawlConfig(YamlModel):
    concurrency: int = 10
    user_agent: str = "Mozilla/5.0 (storyweb)"
    sites: List[SiteConfig]
