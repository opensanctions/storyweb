import queryString from 'query-string';

import { IIdentity, IRefTag } from "./types";


export function getRefTagLink(reftag: IRefTag): string {
  if (!!reftag.cluster) {
    return `/identities/${reftag.cluster}`
  }
  return `/tags/${reftag.ref.id}/${reftag.key}`
}

export function getLinkLoomLink(anchor: IIdentity, reftag?: IRefTag): string {
  return queryString.stringifyUrl({
    'url': `/linkloom/`,
    'query': { anchor: anchor.id, ref_id: reftag?.ref?.id, key: reftag?.key, other: reftag?.cluster }
  })
}