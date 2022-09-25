from functools import cached_property
from types import NoneType
from typing import Any, Callable
from urllib.parse import urljoin, urlparse


class URL(object):
    def __init__(self, url: str) -> None:
        if isinstance(url, URL):
            url = url.url
        self.url = url

    @cached_property
    def parsed(self):
        return urlparse(self.url)

    @cached_property
    def domain(self):
        domain = self.parsed.hostname or "localhost"
        return domain.strip(".").lower()

    @cached_property
    def scheme(self):
        if self.parsed.scheme is None or not len(self.parsed.scheme):
            return "http"
        return self.parsed.scheme.lower().strip()

    def clean(self) -> "URL":
        parsed = self.parsed._replace(fragment="")
        parsed = parsed._replace(netloc=parsed.netloc.lower())
        return URL(parsed.geturl())

    def join(self, text: str) -> "URL":
        return URL(urljoin(self.url, text))

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, text: Any):
        if not isinstance(text, (str, NoneType, URL)):
            raise TypeError("URL is not a string: %r", type(text))
        return text

    def __str__(self) -> str:
        return self.url

    def __repr__(self) -> str:
        return self.url

    def __hash__(self) -> int:
        return hash(self.url)

    def __eq__(self, other: Any) -> bool:
        return other == self.url
