import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'

import Layout from '../components/Layout'

import Link from 'next/link';

export default function Home({ }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title="Intro page">
      <h1>Welcome to storyweb</h1>
      <ul>
        <li><Link href="/tags">Tag listing</Link></li>
      </ul>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

  return {
    props: {}
  }
}
