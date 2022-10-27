import queryString from 'query-string';

import { IClusterBase } from "./types";

export function getClusterLink(cluster: IClusterBase): string {
  return `/clusters/${cluster.id}`
}


export function getLinkLoomLink(anchor: IClusterBase, other?: IClusterBase): string {
  return queryString.stringifyUrl({
    'url': `/linkloom/`,
    'query': { anchor: anchor.id, other: other?.id }
  })
}