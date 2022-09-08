import re
from pantomime import normalize_mimetype
from functools import cached_property
from typing import Any, List, Literal, Optional, Union
from urllib.parse import urlparse
from pydantic import BaseModel, Field
from storyweb.crawl.mime import MIME_GROUPS

from storyweb.crawl.page import Page


class BaseRule(BaseModel):
    class Config:
        # arbitrary_types_allowed = True
        keep_untouched = (cached_property,)

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        return None


class MatchRule(BaseRule):
    match: Union[Literal["all"], Literal["none"]]

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        return self.match == "all"


class OrRule(BaseRule):
    ors: List["Rules"] = Field(..., alias="or")

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        for rule in self.ors:
            if rule.check(url, page) is True:
                return True
        return False


class AndRule(BaseRule):
    ands: List["Rules"] = Field(..., alias="and")

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        for rule in self.ands:
            if rule.check(url, page) is False:
                return False
        return True


class NotRule(BaseRule):
    not_rule: "Rules" = Field(..., alias="not")

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        result = self.not_rule.check(url, page)
        if result is None:
            return None
        return not result


class UrlBaseRule(BaseRule):
    def check_url(self, url: str) -> bool:
        return False

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        if self.check_url(url):
            return True
        if page is not None and page.url is not None and page.url != url:
            if self.check_url(page.url):
                return True
        return False


class DomainRule(UrlBaseRule):
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

    def check_url(self, url: str) -> bool:
        domain = self.clean_domain(url)
        if domain == self.cleaned_domain:
            return True
        if domain.endswith(f".{self.cleaned_domain}"):
            return True
        return False


class PatternRule(BaseRule):
    pattern: str

    @cached_property
    def rex(self) -> re.Pattern:
        return re.compile(self.pattern, re.I | re.U)

    def check_url(self, url: str) -> bool:
        return self.rex.match(url) is not None


class PrefixRule(BaseRule):
    prefix: str

    def check_url(self, url: str) -> bool:
        return url.startswith(self.prefix)


class XpathRule(BaseRule):
    xpath: str

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        if page is None:
            return None
        if page.doc.xpath(self.xpath) is not None:
            return True
        return False


class ElementRule(BaseRule):
    element: str

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        if page is None:
            return None
        if page.doc.find(self.element) is not None:
            return True
        return False


class MimeTypeRule(BaseRule):
    mime_type: str

    @cached_property
    def mime_type_norm(self) -> str:
        return normalize_mimetype(self.mime_type)

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        if page is None:
            return None
        content_type = normalize_mimetype(self.mime_type)
        return content_type == self.mime_type_norm


class MimeGroupRule(BaseRule):
    mime_group: str

    def check(self, url: str, page: Optional[Page]) -> Optional[bool]:
        if page is None:
            return None
        content_type = normalize_mimetype(page.content_type)
        if content_type.startswith(f"{self.mime_group}/"):
            return True
        group = MIME_GROUPS.get(self.mime_group, [])
        return content_type in group


Rules = Union[
    MatchRule,
    OrRule,
    AndRule,
    NotRule,
    DomainRule,
    PatternRule,
    PrefixRule,
    XpathRule,
    ElementRule,
    MimeTypeRule,
    MimeGroupRule,
]
AndRule.update_forward_refs()
OrRule.update_forward_refs()
NotRule.update_forward_refs()
