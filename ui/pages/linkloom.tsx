import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import queryString from 'query-string';
import Link from 'next/link';
import Container from 'react-bootstrap/Container';

import Layout from '../components/Layout'
import { API_URL } from '../lib/constants';
import { IIdentity, IRefTagListingResponse } from '../lib/types';

interface IPageProps {
  anchorId: string
  anchor: IIdentity
  other: IIdentity
}

export default function LinkLoom({ anchorId, anchor, other }: IPageProps) {
  return (
    <Layout title="Link loom">
      <Container>
        <h1>{anchor.label} ./. {other.label}</h1>
      </Container>
    </Layout>
  )
}

async function getOtherIdentity(anchorId: string, key?: string, refId?: string, otherId?: string): Promise<IIdentity | undefined> {
  if (!!otherId) {
    const res = await fetch(`${API_URL}/identities/${otherId}`);
    return await res.json() as IIdentity
  }
  if (!!key && !!refId) {
    const res = await fetch(`${API_URL}/tags/${refId}/${key}`);
    return await res.json() as IIdentity
  }
  const corefApiUrl = queryString.stringifyUrl({
    'url': `${API_URL}/tags`,
    'query': { coref: anchorId, limit: 1 }
  })
  const corefRes = await fetch(corefApiUrl);
  const tags = await corefRes.json() as IRefTagListingResponse;
  if (tags.results.length > 0) {
    const reftag = tags.results[0];
    return await getOtherIdentity(anchorId, reftag.key, reftag.ref.id, reftag.cluster)
  }
  return undefined;
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
  const refId = context.query.ref_id as (string | undefined);
  const otherId = context.query.other as (string | undefined);
  const other = await getOtherIdentity(anchorId, key, refId, otherId);
  if (other === undefined) {
    return { redirect: { destination: `/identities/${anchorId}`, permanent: false } };
  }
  return {
    props: { anchorId, anchor, other }
  }
}
