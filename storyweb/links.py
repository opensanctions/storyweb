from typing import Dict, List
from storyweb.models import LinkType


class LinkTypeRegistry(object):
    def __init__(self) -> None:
        self.items: Dict[str, LinkType] = {}

    def all(self) -> List[LinkType]:
        return list(self.items.values())

    def __setattr__(self, name: str, value: LinkType) -> None:
        self.items[name] = value

    def __getitem__(self, name: str) -> LinkType:
        return self.items[name]

    def __getattr__(self, name: str) -> LinkType:
        return self.items[name]


types = LinkTypeRegistry()
types.SAME = LinkType(
    name="SAME",
    directed=False,
    label="Same as",
    phrase="is the same as",
)
types.OBSERVER = LinkType(
    name="OBSERVER",
    directed=True,
    label="Observer",
    phrase="writes about",
)
types.UNRELATED = LinkType(
    name="UNRELATED",
    directed=False,
    label="Unrelated",
    phrase="has nothing to do with",
)


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
