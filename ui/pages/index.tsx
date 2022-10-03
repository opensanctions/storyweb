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
