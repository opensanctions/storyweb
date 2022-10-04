from typing import Dict, List
from storyweb.models import LinkType

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


class LinkTypeRegistry(object):
    def __init__(self) -> None:
        self.items: Dict[str, LinkType] = {}

    def all(self) -> List[LinkType]:
        return list(self.items.values())

    def register(self, name: str, directed: bool, label: str, phrase: str):
        self.items[name] = LinkType(
            name=name, directed=directed, label=label, phrase=phrase
        )

    def __getitem__(self, name: str) -> LinkType:
        return self.items[name]

    def __getattr__(self, name: str) -> LinkType:
        return self.items[name]


types = LinkTypeRegistry()
types.register(
    name="SAME",
    directed=False,
    label="Same as",
    phrase="is the same as",
)
types.register(
    name="OBSERVER",
    directed=True,
    label="Observer",
    phrase="writes about",
)
types.register(
    name="UNRELATED",
    directed=False,
    label="Unrelated",
    phrase="has nothing to do with",
)
types.register(
    name="OTHER",
    directed=False,
    label="Other link",
    phrase="is linked to",
)
