import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Link from 'next/link';

import Layout from '../components/Layout';


export default function Home({ }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title="Intro page">
      <h1>Welcome to storyweb</h1>
      <ul>
        <li><Link href="/clusters">Entities</Link></li>
      </ul>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

  return {
    props: {}
  }
}
