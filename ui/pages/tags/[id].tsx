import type { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from 'next'
import queryString from 'query-string';
import Head from 'next/head'
import Image from 'next/image'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';

import Layout from '../../components/Layout'
import { API_URL } from '../../lib/constants';

import { ITag, IArticleTagListingResponse } from '../../lib/types';
import Link from 'next/link';
import { getLinkLoomLink, getTagLink } from '../../lib/util';

interface TagProps {
  tag: ITag
  related: IArticleTagListingResponse
}

export default function Tag({ tag, related }: TagProps) {
  return (
    <Layout title={tag.label}>
      <Container>
        <h1>{tag.label}</h1>
        <p>
          <Badge bg="secondary">{tag.category}</Badge>
          ID: <code>{tag.id}</code>, Cluster: <code>{tag.cluster}</code>
        </p>
        <p>
          <Link href={getLinkLoomLink(tag)}>Start matching</Link>
        </p>
        <Table>
          <thead>
            <tr>
              <th>Count</th>
              <th>Tag</th>
              <th>Category</th>
              <th>Link</th>
              <th>Source</th>
              <th>Site</th>
            </tr>
          </thead>
          <tbody>
            {related.results.map((reltag) => (
              <tr>
                <td>{reltag.count}</td>
                <td>
                  <Link href={getTagLink(reltag)}>{reltag.label}</Link>

                </td>
                <td><code>{reltag.category}</code></td>
                <td>
                  {!!reltag.link_type && (
                    <Link href={getLinkLoomLink(tag, reltag)}>{reltag.link_type}</Link>
                  )}
                  {!reltag.link_type && (
                    <Link href={getLinkLoomLink(tag, reltag)}>add</Link>
                  )}

                </td>
                <td>
                  <a target="_blank" href={reltag.article.url}>{reltag.article.title}</a>
                </td>
                <td>
                  {reltag.article.site}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <code>{related.debug_msg}</code>
      </Container>
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
    'url': `${API_URL}/tags`,
    'query': {
      coref: tag.cluster
    }
  })
  const corefRes = await fetch(corefApiUrl);
  const related = await corefRes.json() as IArticleTagListingResponse

  return {
    props: { tag, related },
  }
}
