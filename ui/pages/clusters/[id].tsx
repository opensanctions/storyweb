import type { GetServerSidePropsContext } from 'next'
import Link from 'next/link';

import Layout from '../../components/Layout'
import { ITag, IListingResponse, ICluster, IClusterDetails, IRelatedCluster, ISimilarCluster } from '../../lib/types';

import { getClusterLink, getLinkLoomLink } from '../../lib/util';
import { SpacedList, TagCategory, TagLabel } from '../../components/util';
import { fetchJson } from '../../lib/data';
import { HTMLTable } from '@blueprintjs/core';

interface TagProps {
  cluster: IClusterDetails
  related: IListingResponse<IRelatedCluster>
  similar: IListingResponse<ISimilarCluster>
}

export default function ClusterView({ cluster, related, similar }: TagProps) {
  return (
    <Layout title={cluster.label}>
      <h1>
        <TagLabel label={cluster.label} />
      </h1>
      <p>
        <TagCategory category={cluster.category} />
      </p>
      <p>
        Aliases:{' '}
        <SpacedList values={cluster.labels.map((l) => <TagLabel key={l} label={l} />)} />
      </p>
      <p>
        <Link href={getLinkLoomLink(cluster)}>Start matching</Link>
      </p>
      <h3>Related</h3>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Link</th>
            <th>Articles</th>
          </tr>
        </thead>
        <tbody>
          {related.results.map((related) => (
            <tr key={related.id}>
              <td>
                <Link href={getClusterLink(related)}>{related.label}</Link>
              </td>
              <td><code>{related.category}</code></td>
              <td>
                {related.link_types.length > 0 && (
                  <Link href={getLinkLoomLink(cluster, related)}><>{related.link_types}</></Link>
                )}
                {related.link_types.length === 0 && (
                  <Link href={getLinkLoomLink(cluster, related)}>add</Link>
                )}
              </td>
              <td>{related.articles}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <code>{related.debug_msg}</code>
      <h3>Similar</h3>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Common tags</th>
            <th>Count</th>
            <th>Same</th>
          </tr>
        </thead>
        <tbody>
          {similar.results.map((similar) => (
            <tr key={similar.id}>
              <td>
                <Link href={getClusterLink(similar)}>{similar.label}</Link>
              </td>
              <td><code>{similar.category}</code></td>
              <td>
                <SpacedList values={similar.common.map((l) => <TagLabel key={l} label={l} />)} />
              </td>
              <td>
                {similar.common_count}
              </td>
              <td>
                {'[ ]'}
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <code>{related.debug_msg}</code>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const clusterId = context.params?.id as (string | undefined);
  if (clusterId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const cluster = await fetchJson<IClusterDetails>(`/clusters/${clusterId}`);
  if (clusterId !== cluster.id) {
    return { redirect: { destination: `/clusters/${cluster.id}`, permanent: false } };
  }
  const relatedPath = `/clusters/${cluster.id}/related`;
  const related = await fetchJson<IListingResponse<IRelatedCluster>>(relatedPath);

  const similarPath = `/clusters/${cluster.id}/similar`;
  const similar = await fetchJson<IListingResponse<ISimilarCluster>>(similarPath);
  return {
    props: { cluster, related, similar },
  }
}
