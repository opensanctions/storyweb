import re
import Levenshtein
from typing import List, Optional
from normality import collapse_spaces

PREFIXES_RAW_LIST = [
    "Mr",
    "Ms",
    "Mrs",
    "Mister",
    "Miss",
    "Madam",
    "Madame",
    "Monsieur",
    "Mme",
    "Mmme",
    "Herr",
    "Hr",
    "Frau",
    "Fr",
    "The",
    "Fräulein",
    "Senor",
    "Senorita",
    "Sr",
    "Sir",
    "Lady",
    "The",
    "de",
    "of",
]
PREFIXES_RAW = "|".join(PREFIXES_RAW_LIST)
NAME_PATTERN_ = r"^\W*((%s)\.?\s+)*(?P<term>.*?)([\'’]s)?\W*$"
NAME_PATTERN_ = NAME_PATTERN_ % PREFIXES_RAW
PREFIXES = re.compile(NAME_PATTERN_, re.I | re.U)


def clean_entity_name(name: str) -> Optional[str]:
    match = PREFIXES.match(name)
    if match is not None:
        name = match.group("term")
    return collapse_spaces(name)


def most_common(texts: List[str]) -> str:
    # https://stackoverflow.com/questions/1518522/find-the-most-common-element-in-a-list
    return max(set(texts), key=texts.count)


def pick_name(names: List[str]) -> str:
    return Levenshtein.setmedian(names)
