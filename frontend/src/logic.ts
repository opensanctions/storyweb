import { IClusterBase, IOntology } from "./types";


export function isA(ontology: IOntology, type_: string, required: string): boolean {
  if (type_ === required) {
    return true
  }
  const clusterType = ontology.cluster_types.find((ct) => ct.name === type_);
  if (clusterType === undefined || clusterType.parent === undefined) {
    return false;
  }
  return isA(ontology, clusterType.parent, required);
}

export function canHaveLink(ontology: IOntology, source: IClusterBase, target: IClusterBase, linkType: string): boolean {
  const linkTypeEnt = ontology.link_types.find((lt) => lt.name === linkType);
  if (linkTypeEnt === undefined) {
    return false;
  }
  if (!isA(ontology, source.type, linkTypeEnt.source_type)) {
    return false;
  }
  if (!isA(ontology, target.type, linkTypeEnt.target_type)) {
    return false;
  }
  return true;
}

export function canHaveBidi(ontology: IOntology, source: IClusterBase, target: IClusterBase, linkType: string): boolean {
  return canHaveLink(ontology, source, target, linkType) || canHaveLink(ontology, target, source, linkType);
}