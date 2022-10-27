import type { GetServerSidePropsContext } from 'next'
import Link from 'next/link';

import Layout from '../../components/Layout'
import { ITag, IListingResponse, ICluster, IClusterDetails, IRelatedCluster } from '../../lib/types';

import { getClusterLink, getLinkLoomLink } from '../../lib/util';
import { SpacedList, TagCategory, TagLabel } from '../../components/util';
import { fetchJson } from '../../lib/data';
import { HTMLTable } from '@blueprintjs/core';

interface TagProps {
  cluster: IClusterDetails
  related: IListingResponse<IRelatedCluster>
}

export default function ClusterView({ cluster, related }: TagProps) {
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
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Articles</th>
            <th>Name</th>
            <th>Category</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {related.results.map((related) => (
            <tr key={related.id}>
              <td>{related.articles}</td>
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
  return {
    props: { cluster, related },
  }
}
