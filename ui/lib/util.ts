import queryString from 'query-string';

import { IArticleTag, ICluster, ITag } from "./types";

type Tagish = ITag | IArticleTag | ICluster

export function getTagLink(tag: Tagish): string {
  return `/tags/${tag.id}`
}

export function getLinkLoomLink(anchor: Tagish, other?: Tagish): string {
  return queryString.stringifyUrl({
    'url': `/linkloom/`,
    'query': { anchor: anchor.id, other: other?.id }
  })
}