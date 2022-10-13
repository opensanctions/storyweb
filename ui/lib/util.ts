import queryString from 'query-string';

import { IArticleTag, ITag } from "./types";


export function getTagLink(tag: ITag | IArticleTag): string {
  return `/tags/${tag.id}`
}

export function getLinkLoomLink(anchor: ITag, other?: ITag): string {
  return queryString.stringifyUrl({
    'url': `/linkloom/`,
    'query': { anchor: anchor.id, other: other?.id }
  })
}