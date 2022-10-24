import type { GetServerSidePropsContext } from 'next'
import queryString from 'query-string';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';

import Layout from '../../components/Layout'
import { API_URL } from '../../lib/constants';

import { ITag, IClusterListingResponse } from '../../lib/types';
import Link from 'next/link';
import { getClusterLink, getLinkLoomLink } from '../../lib/util';
import { TagCategory, TagLabel } from '../../components/util';

interface TagProps {
  tag: ITag
  related: IClusterListingResponse
}

export default function Tag({ tag, related }: TagProps) {
  return (
    <Layout title={tag.label}>
      <h1><TagLabel label={tag.label} /></h1>
      <p>
        <TagCategory category={tag.category} />
        ID: <code>{tag.id}</code>, Cluster: <code>{tag.cluster}</code>
      </p>
      <p>
        <Link href={getLinkLoomLink(tag)}>Start matching</Link>
      </p>
      <Table>
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
            <tr>
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
      </Table>
      <code>{related.debug_msg}</code>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const tagId = context.params?.id as (string | undefined);
  if (tagId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const res = await fetch(`${API_URL}/tags/${tagId}`);
  const tag = await res.json() as ITag;

  const corefApiUrl = queryString.stringifyUrl({
    'url': `${API_URL}/clusters`,
    'query': {
      coref: tag.cluster
    }
  })
  const corefRes = await fetch(corefApiUrl);
  const related = await corefRes.json() as IClusterListingResponse

  return {
    props: { tag, related },
  }
}
