import { Icon } from '@blueprintjs/core';
import queryString from 'query-string';
import { IClusterBase } from "../types";

type ClusterSearchesProps = {
  cluster: IClusterBase,
}

export function ClusterGoogleSearch({ cluster }: ClusterSearchesProps) {
  const url = queryString.stringifyUrl({ url: 'https://www.google.com/search', query: { q: cluster.label } });
  return <a href={url}><Icon icon="search-text" /> Google search</a>
}

export function ClusterSanctionsSearch({ cluster }: ClusterSearchesProps) {
  const url = queryString.stringifyUrl({ url: 'https://www.opensanctions.org/search', query: { q: cluster.label } });
  return <a href={url}><Icon icon="search-text" /> OpenSanctions search</a>
}