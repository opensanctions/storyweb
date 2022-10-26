import type { GetServerSidePropsContext } from 'next'
import Link from 'next/link';

import Layout from '../../components/Layout'
import { ITag, IListingResponse, ICluster } from '../../lib/types';

import { getClusterLink, getLinkLoomLink } from '../../lib/util';
import { TagCategory, TagLabel } from '../../components/util';
import { fetchJson } from '../../lib/data';
import { HTMLTable } from '@blueprintjs/core';

interface TagProps {
  tag: ITag
  related: IListingResponse<ICluster>
}

export default function Tag({ tag, related }: TagProps) {
  return (
    <Layout title={tag.label}>
      <h1>
        <TagLabel label={tag.label} />
      </h1>
      <p>
        <TagCategory category={tag.category} />
        ID: <code>{tag.id}</code>, Cluster: <code>{tag.cluster}</code>
      </p>
      <p>
        <Link href={getLinkLoomLink(tag)}>Start matching</Link>
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
          {related.results.map((cluster) => (
            <tr key={cluster.id}>
              <td>{cluster.tags}</td>
              <td>
                <Link href={getClusterLink(cluster)}>{cluster.label}</Link>
              </td>
              <td><code>{cluster.category}</code></td>
              <td>
                {!!cluster.link_type && (
                  <Link href={getLinkLoomLink(tag, cluster)}>{cluster.link_type}</Link>
                )}
                {!cluster.link_type && (
                  <Link href={getLinkLoomLink(tag, cluster)}>add</Link>
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
  const tagId = context.params?.id as (string | undefined);
  if (tagId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const tag = await fetchJson<ITag>(`/tags/${tagId}`);
  const corefQuery = { coref: tag.cluster };
  const related = await fetchJson<IListingResponse<ICluster>>('/clusters', corefQuery);
  return {
    props: { tag, related },
  }
}
