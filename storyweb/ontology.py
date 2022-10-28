from optparse import Option
from pathlib import Path
from pydantic import BaseModel
from pydantic_yaml import YamlModel
from typing import Any, Dict, List, Optional

from storyweb.clean import most_common


class NodeTypeModel(BaseModel):
    name: str
    label: str
    plural: str
    parent: Optional[str]


class LinkTypeModel(BaseModel):
    name: str
    directed: bool = False
    label: str
    phrase: str
    source_type: str
    target_type: str


class OntologyModel(YamlModel):
    node_types: List[NodeTypeModel]
    link_types: List[LinkTypeModel]


class NodeType(object):
    PERSON = "PER"
    ORGANIZATION = "ORG"
    LOCATION = "LOC"

    def __init__(self, ontology: "Ontology", model: NodeTypeModel):
        self.ontology = ontology
        self.model = model
        self.name = model.name
        self.label = model.label
        self.plural = model.plural

    @property
    def parent(self) -> Optional["NodeType"]:
        if self.model.parent is None:
            return None
        return self.ontology.get_node_type(self.model.parent)

    def pick(self, names: List[str]) -> str:
        """Given a set of categories, pick the most descriptive one."""
        # TODO: does this want to be a proper class-based type system (ftm?) at
        # some point?
        # if not len(categories):
        #     raise TypeError("No categories for this entity!")
        # unique = set(categories)
        # if len(unique) == 1:
        #     return categories[0]
        # if LOCATION in unique:
        #     # works in practice, not in theory:
        #     return LOCATION
        # if PERSON in unique and ORGANIZATION in unique:
        #     return ENTITY
        # if PERSON in unique:
        #     return PERSON
        # return ORGANIZATION
        return most_common(names)


class LinkType(object):
    SAME = "SAME"

    def __init__(self, ontology: "Ontology", model: LinkTypeModel):
        self.ontology = ontology
        self.model = model

    @property
    def source_type(self) -> "NodeType":
        return self.ontology.get_node_type(self.model.source_type)

    @property
    def target_type(self) -> "NodeType":
        return self.ontology.get_node_type(self.model.target_type)


class Ontology(object):
    def __init__(self, model: OntologyModel):
        self.model = model
        self.node_types = {n.name: NodeType(self, n) for n in model.node_types}
        self.link_types = {l.name: LinkType(self, l) for l in model.link_types}

        assert LinkType.SAME in self.link_types, LinkType.SAME
        assert NodeType.LOCATION in self.node_types, NodeType.LOCATION
        assert NodeType.PERSON in self.node_types, NodeType.PERSON
        assert NodeType.ORGANIZATION in self.node_types, NodeType.ORGANIZATION

    def get_node_type(self, name: str) -> NodeType:
        return self.node_types[name]

    def get_link_type(self, name: str) -> LinkType:
        return self.link_types[name]

    @classmethod
    def load(cls) -> "Ontology":
        path = Path(__file__).parent / "ontology.yml"
        model = OntologyModel.parse_file(path)
        return Ontology(model)


ontology = Ontology.load()
