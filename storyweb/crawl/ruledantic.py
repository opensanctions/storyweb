from functools import cached_property
from typing import Any, List, Literal, Optional, Union
from urllib.parse import urlparse
from pydantic import BaseModel, Field

from storyweb.crawl.page import Page


class BaseRule(BaseModel):
    class Config:
        # arbitrary_types_allowed = True
        keep_untouched = (cached_property,)

    def check(self, url: str, page: Optional[Page]) -> bool:
        return False


class MatchRule(BaseRule):
    match: Union[Literal["all"], Literal["none"]]

    def check(self, url: str, page: Optional[Page]) -> bool:
        return self.match == "all"


class OrRule(BaseRule):
    ors: List["Rules"] = Field(..., alias="or")

    def check(self, url: str, page: Optional[Page]) -> bool:
        for rule in self.ors:
            if rule.check(url, page):
                return True
        return False


class AndRule(BaseRule):
    ands: List["Rules"] = Field(..., alias="and")

    def check(self, url: str, page: Optional[Page]) -> bool:
        for rule in self.ands:
            if not rule.check(url, page):
                return False
        return True


class NotRule(BaseRule):
    not_rule: "Rules" = Field(..., alias="not")

    def check(self, url: str, page: Optional[Page]) -> bool:
        return not self.not_rule.check(url, page)


class DomainRule(BaseRule):
    domain: str

    def clean_domain(self, domain: Optional[str]) -> str:
        if domain is None:
            return "nothing.example.com"
        pr = urlparse(domain)
        domain = pr.hostname or pr.path
        domain = domain.strip(".").lower()
        return domain

    @cached_property
    def cleaned_domain(self) -> str:
        return self.clean_domain(self.domain)

    def check_domain(self, domain: str) -> bool:
        clean = self.clean_domain(domain)
        if clean == self.cleaned_domain:
            return True
        if clean.endswith(f".{self.cleaned_domain}"):
            return True
        return False

    def check(self, url: str, page: Optional[Page]) -> bool:
        if self.check_domain(url):
            return True
        if page is not None and page.url is not None and page.url != url:
            if self.check_domain(page.url):
                return True
        return False


Rules = Union[MatchRule, OrRule, AndRule, NotRule, DomainRule]
AndRule.update_forward_refs()
OrRule.update_forward_refs()
NotRule.update_forward_refs()
