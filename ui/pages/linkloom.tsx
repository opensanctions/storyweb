import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Link from 'next/link';
import Container from 'react-bootstrap/Container';

import Layout from '../components/Layout'
import { API_URL } from '../lib/constants';
import { IIdentity } from '../lib/types';

export default function LinkLoom({ anchorId, anchor }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title="Link loom">
      <Container>
        <h1>{anchorId}</h1>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // TODO: we want - other ID
  // accept 1: otherId
  // accept 2: ref_id, key
  // accept 3: nothing, auto=true
  const anchorId = context.query.anchor as (string | undefined);
  if (anchorId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const anchorRes = await fetch(`${API_URL}/identities/${anchorId}`);
  const anchor = await anchorRes.json() as IIdentity

  const key = context.query.key as (string | undefined);
  const refId = context.query.refId as (string | undefined);
  const otherId = context.query.otherId as (string | undefined);
  // let other = null;
  // if ()
  return {
    props: { anchorId, anchor }
  }
}
