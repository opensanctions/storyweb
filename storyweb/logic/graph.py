import json
import countrynames
from typing import List, Optional, Generator, Dict
from networkx import DiGraph
from followthemoney import model
from followthemoney.proxy import EntityProxy
from sqlalchemy.future import select
from sqlalchemy.engine import Row
from networkx.readwrite.gexf import generate_gexf

from storyweb.db import Conn, link_table, tag_table, story_article_table
from storyweb.ontology import ontology, LinkType


def query_links(
    conn: Conn,
    story_id: Optional[int] = None,
    link_types: List[str] = list(ontology.link_types.keys()),
) -> Generator[Row, None, None]:
    link_t = link_table.alias("l")
    source_t = tag_table.alias("s")
    target_t = tag_table.alias("t")

    lstmt = select(
        link_t.c.type.label("link_type"),
        source_t.c.cluster.label("source_id"),
        source_t.c.label.label("source_alias"),
        source_t.c.cluster_label.label("source_label"),
        source_t.c.cluster_type.label("source_type"),
        target_t.c.cluster.label("target_id"),
        target_t.c.label.label("target_alias"),
        target_t.c.cluster_label.label("target_label"),
        target_t.c.cluster_type.label("target_type"),
    )

    if story_id is not None:
        sa_source_t = story_article_table.alias("src_sa")
        sa_target_t = story_article_table.alias("tgt_sa")
        lstmt = lstmt.join(source_t, link_t.c.source_cluster == source_t.c.cluster)
        lstmt = lstmt.join(sa_source_t, sa_source_t.c.article == source_t.c.article)
        lstmt = lstmt.filter(sa_source_t.c.story == story_id)
        lstmt = lstmt.join(target_t, link_t.c.target_cluster == target_t.c.cluster)
        lstmt = lstmt.join(sa_target_t, sa_target_t.c.article == target_t.c.article)
        lstmt = lstmt.filter(sa_target_t.c.story == story_id)
        # lstmt = lstmt.filter(
        #     or_(
        #         sa_target_t.c.story == story,
        #         sa_source_t.c.story == story,
        #     )
        # )
    else:
        lstmt = lstmt.join(source_t, link_t.c.source_cluster == source_t.c.id)
        lstmt = lstmt.join(target_t, link_t.c.target_cluster == target_t.c.id)

    lstmt = lstmt.where(link_t.c.type.in_(link_types))
    lstmt = lstmt.distinct()
    for row in conn.execute(lstmt):
        yield row


def generate_graph(
    conn: Conn,
    story_id: Optional[int] = None,
    link_types: List[str] = list(ontology.link_types.keys()),
) -> DiGraph:
    for skip in (LinkType.SAME, LinkType.UNRELATED):
        if skip in link_types:
            link_types.remove(skip)

    graph = DiGraph()
    for row in query_links(conn, story_id=story_id, link_types=link_types):
        source_id = row["source_id"]
        target_id = row["target_id"]
        if not graph.has_node(source_id):
            graph.add_node(
                source_id,
                label=row["source_label"],
                node_type=row["source_type"],
            )
        if not graph.has_node(target_id):
            graph.add_node(
                target_id,
                label=row["target_label"],
                node_type=row["target_type"],
            )
        graph.add_edge(
            source_id,
            target_id,
            edge_type=row["link_type"],
        )
    return graph


def generate_graph_gexf(
    conn: Conn,
    story_id: Optional[int] = None,
    link_types: List[str] = list(ontology.link_types.keys()),
) -> str:
    graph = generate_graph(conn, story_id=story_id, link_types=link_types)
    return "\n".join(generate_gexf(graph))


def _make_ent(row: Row, prefix: str) -> EntityProxy:
    type_ = row[f"{prefix}_type"]
    schema = ontology.get_cluster_type(type_).ftm
    ent = model.make_entity(schema)
    ent_id = row[f"{prefix}_id"]
    ent.id = f"sw-{ent_id}"
    label = row[f"{prefix}_label"]
    alias = row[f"{prefix}_alias"]
    ent.add("name", label)
    if alias != label:
        ent.add("alias", alias)
    return ent


def generate_graph_ftm(conn: Conn, story_id: Optional[int] = None) -> str:
    link_types = list(ontology.link_types.keys())
    for skip in (LinkType.SAME, LinkType.UNRELATED):
        if skip in link_types:
            link_types.remove(skip)

    entities: Dict[str, EntityProxy] = {}

    def _merge(e: EntityProxy):
        if e.id in entities:
            entities[e.id].merge(e)
        else:
            entities[e.id] = e

    for row in query_links(conn, story_id=story_id, link_types=link_types):
        if row["link_type"] == "LOCATED" and row["target_type"] == "LOC":
            for label in (row["target_label"], row["target_alias"]):
                code = countrynames.to_code(label)
                if code is None:
                    continue
                ent = _make_ent(row, "source")
                ent.add("country", code)
                _merge(ent)
            continue

        if row["source_type"] == "LOC" or row["target_type"] == "LOC":
            continue

        source = _make_ent(row, "source")
        target = _make_ent(row, "target")

        link_type = ontology.get_link_type(row["link_type"])
        if not link_type.ftm:
            continue

        schema = model.get(link_type.ftm)
        if schema is None or not schema.edge:
            raise ValueError()

        link = model.make_entity(schema)
        link.make_id(source.id, target.id, link_type.model.name)
        link.add("summary", link_type.model.label)
        link.add(schema.edge_source, source)
        link.add(schema.edge_target, target)

        _merge(source)
        _merge(target)
        _merge(link)

    texts = []
    for ent in entities.values():
        # print(ent.to_dict())
        texts.append(json.dumps(ent.to_dict()))

    return "\n".join(texts)
