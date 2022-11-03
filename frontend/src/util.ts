import queryString from 'query-string';
// import { useLocation } from 'react-router-dom';

import { IClusterBase } from "./types";


export function asString(value: any): string | undefined {
  if (!Array.isArray(value)) {
    value = [value];
  }
  for (let item of value) {
    if (item === null || item === undefined) {
      return undefined
    }
    item = item + ''
    item = item.trim()
    if (item.length > 0) {
      return item;
    }
  }
  return undefined;
}

export function getClusterLink(cluster: IClusterBase): string {
  return `/clusters/${cluster.id}`
}

export function getLinkLoomLink(anchor: IClusterBase, other?: IClusterBase): string {
  return queryString.stringifyUrl({
    'url': `/linkloom/`,
    'query': { anchor: anchor.id, other: other?.id }
  })
}