from typing import List, Optional
from networkx import MultiDiGraph
from sqlalchemy.future import select
from networkx.readwrite.gexf import generate_gexf

from storyweb.db import Conn, link_table, tag_table, story_article_table
from storyweb.ontology import ontology, LinkType


def generate_graph(
    conn: Conn,
    story: Optional[str] = None,
    link_types: List[str] = list(ontology.link_types.keys()),
) -> MultiDiGraph:
    for skip in (LinkType.SAME, LinkType.UNRELATED):
        if skip in link_types:
            link_types.remove(skip)

    graph = MultiDiGraph()

    link_t = link_table.alias("l")
    source_t = tag_table.alias("s")
    target_t = tag_table.alias("t")

    lstmt = select(
        link_t.c.type.label("link_type"),
        source_t.c.cluster.label("source_id"),
        source_t.c.cluster_label.label("source_label"),
        source_t.c.cluster_type.label("source_type"),
        target_t.c.cluster.label("target_id"),
        target_t.c.cluster_label.label("target_label"),
        target_t.c.cluster_type.label("target_type"),
    )

    if story is not None:
        sa_source_t = story_article_table.alias("src_sa")
        sa_target_t = story_article_table.alias("tgt_sa")
        lstmt = lstmt.join(source_t, link_t.c.source_cluster == source_t.c.cluster)
        lstmt = lstmt.join(sa_source_t, sa_source_t.c.article == source_t.c.article)
        lstmt = lstmt.filter(sa_source_t.c.story == story)
        lstmt = lstmt.join(target_t, link_t.c.target_cluster == target_t.c.cluster)
        lstmt = lstmt.join(sa_target_t, sa_target_t.c.article == target_t.c.article)
        lstmt = lstmt.filter(sa_target_t.c.story == story)
    else:
        lstmt = lstmt.join(source_t, link_t.c.source_cluster == source_t.c.id)
        lstmt = lstmt.join(target_t, link_t.c.target_cluster == target_t.c.id)

    lstmt = lstmt.where(link_t.c.type.in_(link_types))
    lstmt = lstmt.distinct()
    for row in conn.execute(lstmt):
        source_id = row["source_id"]
        target_id = row["target_id"]
        if not graph.has_node(source_id):
            graph.add_node(
                source_id,
                label=row["source_label"],
                type=row["source_type"],
            )
        if not graph.has_node(target_id):
            graph.add_node(
                target_id,
                label=row["target_label"],
                type=row["target_type"],
            )
        graph.add_edge(
            source_id,
            target_id,
            link_type=row["link_type"],
        )

    return graph


def generate_graph_gexf(
    conn: Conn,
    story: Optional[str] = None,
    link_types: List[str] = list(ontology.link_types.keys()),
) -> str:
    graph = generate_graph(conn, story=story, link_types=link_types)
    return "\n".join(generate_gexf(graph))
