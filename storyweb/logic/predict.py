from typing import List

from storyweb.db import Conn
from storyweb.logic.clusters import fetch_cluster
from storyweb.logic.links import get_links
from storyweb.ontology import ontology, LinkType
from storyweb.models import LinkPrediction, ClusterBase, Link


def pick_cluster(id: str, *clusters: ClusterBase) -> ClusterBase:
    for cluster in clusters:
        if id == cluster.id:
            return cluster
    raise ValueError("Cluster not found!")


def can_have_link(source: ClusterBase, target: ClusterBase, link_type: str) -> bool:
    obj = ontology.get_link_type(link_type)
    src_type = ontology.get_cluster_type(source.type)
    tgt_type = ontology.get_cluster_type(target.type)
    if not src_type.is_a(obj.source_type.name):
        return False
    if not tgt_type.is_a(obj.target_type.name):
        return False
    return True


# def can_have_bidi(source: ClusterBase, target: ClusterBase, link_type: str) -> bool:
#     pass


def link_predict(conn: Conn, anchor_id: str, other_id: str) -> LinkPrediction:
    anchor = fetch_cluster(conn, anchor_id)
    other = fetch_cluster(conn, other_id)
    if anchor is None or other is None:
        raise ValueError("Invalid clusters for link prediction!")
    link_type = LinkType.UNRELATED

    # Check if there is a link already:
    existing_links: List[Link] = []
    for link in get_links(conn, anchor_id, other_id):
        if link.type == LinkType.UNRELATED:
            continue
        source = pick_cluster(link.source_cluster, anchor, other)
        target = pick_cluster(link.target_cluster, anchor, other)
        if not can_have_link(source, target, link.type):
            continue
        existing_links.append(link)
    if len(existing_links) > 0:
        existing_links.sort(key=lambda l: ontology.get_link_type(l.type).weight)
        link = existing_links[-1]
        return LinkPrediction(
            source=pick_cluster(link.source_cluster, anchor, other),
            target=pick_cluster(link.target_cluster, anchor, other),
            type=link.type,
        )

    return LinkPrediction(source=anchor, target=other, type=link_type)
