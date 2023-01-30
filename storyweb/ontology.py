from pathlib import Path
from pydantic import BaseModel
from pydantic_yaml import YamlModel
from typing import List, Optional

from storyweb.clean import most_common


class ClusterTypeModel(BaseModel):
    name: str
    label: str
    plural: str
    parent: Optional[str]
    color: str
    icon: str
    ftm: str


class LinkTypeModel(BaseModel):
    name: str
    directed: bool = False
    label: str
    phrase: str
    source_type: str
    target_type: str
    ftm: Optional[str]
    weight: int


class OntologyModel(YamlModel):
    cluster_types: List[ClusterTypeModel]
    link_types: List[LinkTypeModel]


class ClusterType(object):
    PERSON = "PER"
    ORGANIZATION = "ORG"
    LOCATION = "LOC"

    def __init__(self, ontology: "Ontology", model: ClusterTypeModel):
        self.ontology = ontology
        self.model = model
        self.name = model.name
        self.label = model.label
        self.plural = model.plural
        self.color = model.color
        self.icon = model.icon
        self.ftm = model.ftm

    @property
    def parent(self) -> Optional["ClusterType"]:
        if self.model.parent is None:
            return None
        return self.ontology.get_cluster_type(self.model.parent)

    def is_a(self, name: str) -> bool:
        if name == self.name:
            return True
        parent = self.parent
        if parent is None:
            return False
        return parent.is_a(name)

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
    UNRELATED = "UNRELATED"

    def __init__(self, ontology: "Ontology", model: LinkTypeModel):
        self.ontology = ontology
        self.model = model
        self.ftm = model.ftm
        self.weight = model.weight

    @property
    def source_type(self) -> "ClusterType":
        return self.ontology.get_cluster_type(self.model.source_type)

    @property
    def target_type(self) -> "ClusterType":
        return self.ontology.get_cluster_type(self.model.target_type)


class Ontology(object):
    def __init__(self, model: OntologyModel):
        self.model = model
        self.node_types = {n.name: ClusterType(self, n) for n in model.cluster_types}
        self.link_types = {l.name: LinkType(self, l) for l in model.link_types}

        assert LinkType.SAME in self.link_types, LinkType.SAME
        assert ClusterType.LOCATION in self.node_types, ClusterType.LOCATION
        assert ClusterType.PERSON in self.node_types, ClusterType.PERSON
        assert ClusterType.ORGANIZATION in self.node_types, ClusterType.ORGANIZATION

    def get_cluster_type(self, name: str) -> ClusterType:
        return self.node_types[name]

    def get_link_type(self, name: str) -> LinkType:
        return self.link_types[name]

    @classmethod
    def load(cls) -> "Ontology":
        path = Path(__file__).parent / "ontology.yml"
        model = OntologyModel.parse_file(path)
        return Ontology(model)


ontology = Ontology.load()
