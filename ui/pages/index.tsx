import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Container from 'react-bootstrap/Container';

import Layout from '../components/Layout'

import Link from 'next/link';

export default function Home({ }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title="Intro page">
      <Container>
        <h1>Welcome to storyweb</h1>
        <ul>
          <li><Link href="/tags">Tag listing</Link></li>
        </ul>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

  return {
    props: {}
  }
}
