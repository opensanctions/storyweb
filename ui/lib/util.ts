import queryString from 'query-string';

import { IArticleTag, ICluster, ITag } from "./types";

type Tagish = ITag | IArticleTag

export function getTagLink(tag: Tagish): string {
  return `/tags/${tag.cluster}`
}

export function getClusterLink(cluster: ICluster): string {
  return `/tags/${cluster.id}`
}


export function getLinkLoomLink(anchor: Tagish, other?: ICluster): string {
  return queryString.stringifyUrl({
    'url': `/linkloom/`,
    'query': { anchor: anchor.cluster, other: other?.id }
  })
}