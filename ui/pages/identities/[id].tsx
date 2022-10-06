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

import { IIdentity, IRefTagListingResponse } from '../../lib/types';
import Link from 'next/link';
import { getLinkLoomLink } from '../../lib/util';

interface IIdentityPageProps {
  identity: IIdentity
  tags: IRefTagListingResponse
}

export default function Identity({ identity, tags }: IIdentityPageProps) {
  return (
    <Layout title={identity.label}>
      <Container>
        <h1>{identity.label}</h1>
        <p>
          <Badge bg="secondary">{identity.category}</Badge>
          ID: <code>{identity.id}</code>, Cluster: <code>{identity.cluster}</code>
        </p>
        <p>
          <Link href={getLinkLoomLink(identity)}>Start matching</Link>
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
            {tags.results.map((reftag) => (
              <tr>
                <td>{reftag.count}</td>
                <td>
                  <Link href={`/tags/${reftag.ref.id}/${reftag.key}`}>{reftag.text}</Link>
                  {!!reftag.cluster && (
                    <>{'*'}</>
                  )}
                </td>
                <td><code>{reftag.category}</code></td>
                <td>
                  {!!reftag.link_type && (
                    <Link href={getLinkLoomLink(identity, reftag)}>{reftag.link_type}</Link>
                  )}
                  {!reftag.link_type && (
                    <Link href={getLinkLoomLink(identity, reftag)}>add</Link>
                  )}

                </td>
                <td>
                  <a target="_blank" href={reftag.ref.url}>{reftag.ref.title}</a>
                </td>
                <td>
                  {reftag.ref.site}
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
