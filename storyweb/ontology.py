from typing import List

# Tag/Node categories (types):
PERSON = "PER"
ORGANIZATION = "ORG"
ENTITY = "ENT"
LOCATION = "LOC"

CATEGORIES = [PERSON, ORGANIZATION, ENTITY, LOCATION]


def pick_category(categories: List[str]):
    """Given a set of categories, pick the most descriptive one."""
    # TODO: does this want to be a proper class-based type system (ftm?) at
    # some point?
    if not len(categories):
        raise TypeError("No categories for this entity!")
    unique = set(categories)
    if len(unique) == 1:
        return categories[0]
    if LOCATION in unique:
        raise TypeError("Cannot merge LOCATION and other type")
    if PERSON in unique and ORGANIZATION in unique:
        return ENTITY
    if PERSON in unique:
        return PERSON
    return ORGANIZATION
