import type { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';

import Layout from '../../components/Layout'
import { API_URL } from '../../lib/constants';

import { IIdentity } from '../../lib/types';

export default function Identity({ identity }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title={identity.label}>
      <Container>
        <h1>{identity.label} <Badge bg="secondary">{identity.category}</Badge></h1>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const identityId = context.params?.id as (string | undefined);
  if (identityId === undefined) {
    return { redirect: { destination: '/identities', permanent: false } };
  }
  const res = await fetch(`${API_URL}/identities/${identityId}`);
  const identity = await res.json() as IIdentity

  return {
    props: { identity },
  }
}
