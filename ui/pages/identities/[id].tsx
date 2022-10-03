import type { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from 'next'
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

import { IIdentity, IRefTagListingResponse } from '../../lib/types';
import Link from 'next/link';

export default function Identity({ identity, tags }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title={identity.label}>
      <Container>
        <h1>{identity.label} <Badge bg="secondary">{identity.category}</Badge></h1>
        <Table>
          <thead>
            <tr>
              <th>Count</th>
              <th>Tag</th>
              <th>Category</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {tags.results.map((reftag) => (
              <tr>
                <td>{reftag.count}</td>
                <td><Link href={`/tags/${reftag.ref.id}/${reftag.key}`}>{reftag.text}</Link></td>
                <td><code>{reftag.category}</code></td>
                <td>
                  <a target="_blank" href={reftag.ref.url}>{reftag.ref.title}</a>
                  {' - '}{reftag.ref.site}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <code>{tags.debug_msg}</code>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const identityId = context.params?.id as (string | undefined);
  if (identityId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const res = await fetch(`${API_URL}/identities/${identityId}`);
  const identity = await res.json() as IIdentity

  const corefApiUrl = queryString.stringifyUrl({
    'url': `${API_URL}/tags`,
    'query': {
      coref: identity.cluster
    }
  })
  const corefRes = await fetch(corefApiUrl);
  const tags = await corefRes.json() as IRefTagListingResponse

  return {
    props: { identity, tags },
  }
}
