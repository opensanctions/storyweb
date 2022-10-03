import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Link from 'next/link';
import Container from 'react-bootstrap/Container';

import Layout from '../components/Layout'

export default function LinkLoom({ anchorId }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title="Link loom">
      <Container>
        <h1>{anchorId}</h1>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const anchorId = context.query.anchor as (string | undefined);
  if (anchorId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  // TODO: we want - other ID
  // accept 1: otherId
  // accept 2: ref_id, key
  // accept 3: nothing, auto=true
  return {
    props: { anchorId }
  }
}
