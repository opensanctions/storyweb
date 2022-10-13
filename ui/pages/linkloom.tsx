import type { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router';
import queryString from 'query-string';
import Link from 'next/link';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

import Layout from '../components/Layout'
import { API_URL } from '../lib/constants';
import { ITag, ILink, ILinkListingResponse, ILinkType, ILinkTypeListingResponse, IClusterListingResponse } from '../lib/types';
import { ChangeEvent, FormEvent, useState } from 'react';
import { getTagLink } from '../lib/util';

interface IPageProps {
  initialType: string
  anchor: ITag
  other: ITag
  linkTypes: ILinkType[]
}

export default function LinkLoom({ anchor, other, linkTypes, initialType }: IPageProps) {
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
    await fetch(`/api/link`, {
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
        <h2>
          <code>
            <Link href={getTagLink(anchor)}>{anchor.label}</Link>
          </code>
          {' '}
          {linkType.phrase}
          {' '}
          <code>
            <Link href={getTagLink(other)}>{other.label}</Link>
          </code>
        </h2>
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

async function getOtherIdentity(anchor: ITag, otherId?: string): Promise<ITag | undefined> {
  if (!!otherId) {
    const res = await fetch(`${API_URL}/tags/${otherId}`);
    return await res.json() as ITag
  }
  const corefApiUrl = queryString.stringifyUrl({
    'url': `${API_URL}/clusters`,
    'query': { coref: anchor.cluster, linked: false, limit: 1 }
  })
  const corefRes = await fetch(corefApiUrl);
  const tags = await corefRes.json() as IClusterListingResponse;
  if (tags.results.length > 0) {
    const reftag = tags.results[0];
    return await getOtherIdentity(anchor, reftag.id)
  }
  return undefined;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const anchorId = context.query.anchor as (string | undefined);
  if (anchorId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const anchorRes = await fetch(`${API_URL}/tags/${anchorId}`);
  const anchor = await anchorRes.json() as ITag

  const otherId = context.query.other as (string | undefined);
  const other = await getOtherIdentity(anchor, otherId);
  if (other === undefined) {
    return { redirect: { destination: `/tags/${anchorId}`, permanent: false } };
  }

  const linkTypesRes = await fetch(`${API_URL}/linktypes`)
  const linkTypes = await linkTypesRes.json() as ILinkTypeListingResponse

  const existingLinkUrl = queryString.stringifyUrl({
    'url': `${API_URL}/links`,
    'query': { cluster: [anchor.cluster, other.cluster], limit: 1 }
  })
  const existingLinkRes = await fetch(existingLinkUrl);
  const existingLink = await existingLinkRes.json() as ILinkListingResponse;
  let initialType = other.fingerprint === anchor.fingerprint ? 'SAME' : 'UNRELATED';
  for (let link of existingLink.results) {
    initialType = link.type;
  }
  return {
    props: { anchor, other, linkTypes: linkTypes.results, initialType }
  }
}
