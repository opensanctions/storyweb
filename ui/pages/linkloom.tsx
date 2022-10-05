import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router';
import queryString from 'query-string';
import Link from 'next/link';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

import Layout from '../components/Layout'
import { API_URL } from '../lib/constants';
import { IIdentity, ILink, ILinkListingResponse, ILinkType, ILinkTypeListingResponse, IRefTagListingResponse } from '../lib/types';
import { ChangeEvent, FormEvent, useState } from 'react';

interface IPageProps {
  initialType: string
  anchorId: string
  anchor: IIdentity
  other: IIdentity
  linkTypes: ILinkType[]
}

export default function LinkLoom({ anchorId, anchor, other, linkTypes, initialType }: IPageProps) {
  const router = useRouter();
  const [link, setLink] = useState({
    source: anchor.id,
    source_cluster: anchor.cluster,
    target: other.id,
    target_cluster: other.cluster,
    type: initialType
  } as ILink);
  const linkType = linkTypes.find((lt) => lt.name == link.type) || linkTypes[0]

  const onSubmit = async function (event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(link),
    });
    router.reload();
  }

  const onChangeType = function (event: ChangeEvent<HTMLInputElement>, type: string) {
    setLink({ ...link, type: type })
  }

  return (
    <Layout title="Link loom">
      <Container>
        <h1><code>{anchor.label}</code> {linkType.phrase} <code>{other.label}</code></h1>
        <Form onSubmit={onSubmit}>
          {linkTypes.map((type) => (
            <Form.Check
              type="radio"
              name="type"
              value={type.name}
              label={type.label}
              checked={type.name == link.type}
              onChange={(e) => onChangeType(e, type.name)}
            />
          ))}

          <Button type="submit">Save</Button>
        </Form>

      </Container>
    </Layout >
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
    'query': { coref: anchorId, coref_linked: false, limit: 1 }
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

  const linkTypesRes = await fetch(`${API_URL}/linktypes`)
  const linkTypes = await linkTypesRes.json() as ILinkTypeListingResponse

  const existingLinkUrl = queryString.stringifyUrl({
    'url': `${API_URL}/links`,
    'query': { identity: [anchor.id, other.id], limit: 1 }
  })
  console.log(existingLinkUrl);
  const existingLinkRes = await fetch(existingLinkUrl);
  const existingLink = await existingLinkRes.json() as ILinkListingResponse;
  let initialType = 'UNRELATED';
  for (let link of existingLink.results) {
    initialType = link.type;
  }

  return {
    props: { anchorId, anchor, other, linkTypes: linkTypes.results, initialType }
  }
}
