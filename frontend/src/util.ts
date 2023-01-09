import queryString from 'query-string';
import { useSearchParams } from 'react-router-dom';
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

export function listToggle<T>(items: T[], value: T): T[] {
  const updated = [...items];
  const index = items.indexOf(value);
  if (index === -1) {
    updated.push(value);
  } else {
    updated.splice(index, 1);
  }
  return updated;
}

export function getClusterLink(cluster: IClusterBase): string {
  return `/clusters/${cluster.id}`
}

export function getLinkLoomLink(anchor: IClusterBase, other?: IClusterBase): string {
  if (other === undefined) {
    return queryString.stringifyUrl({
      'url': `/linker/related`,
      'query': { anchor: anchor.id }
    })
  }
  return queryString.stringifyUrl({
    'url': `/linker`,
    'query': { anchor: anchor.id, other: other.id }
  })
}

export function useListingPagination(prefix: string, limit: number = 15) {
  const [params] = useSearchParams();
  return {
    limit: parseInt(params.get(`${prefix}.limit`) || `${limit}`, 10),
    offset: parseInt(params.get(`${prefix}.offset`) || '0', 10)
  }
}