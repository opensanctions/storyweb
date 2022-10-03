import type { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';

import Layout from '../components/Layout'
import { API_URL } from '../lib/constants';

import styles from '../styles/Home.module.scss'
import { IRefTagListingResponse } from '../lib/types';
import Link from 'next/link';

export default function Home({ response }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout title="Intro page">
      <Container>
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
            {response.results.map((reftag) => (
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
      </Container>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const res = await fetch(`${API_URL}/tags`);
  const data = await res.json() as IRefTagListingResponse
  console.log(data);

  return {
    props: { response: data },
  }
}
