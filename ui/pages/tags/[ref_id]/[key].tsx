import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'

import { API_URL } from '../../../lib/constants';
import { IIdentity } from '../../../lib/types';

export default function TagPage({ }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return null
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const refId = context.params?.ref_id as (string | undefined);
  const key = context.params?.key as (string | undefined);
  if (refId === undefined || key === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const res = await fetch(`${API_URL}/tags/${refId}/${key}`);
  const identity = await res.json() as IIdentity
  return { redirect: { destination: `/identities/${identity.id}` } };
}
