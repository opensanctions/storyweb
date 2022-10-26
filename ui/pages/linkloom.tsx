import type { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router';
import Link from 'next/link';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import Layout from '../components/Layout'
import { ITag, ILink, ILinkType, IListingResponse, ICluster } from '../lib/types';
import { ChangeEvent, FormEvent, useState } from 'react';
import { getTagLink } from '../lib/util';
import { fetchJson } from '../lib/data';

interface IPageProps {
  initialType: string
  anchor: ITag
  other: ITag
  autoMode: boolean
  linkTypes: ILinkType[]
}

export default function LinkLoom({ anchor, other, linkTypes, autoMode, initialType }: IPageProps) {
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
    const resp = await fetch(`/api/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(link),
    });
    const linkResp = await resp.json() as ILink;
    const anchorCluster = link.source_cluster;
    if (autoMode) {
      router.reload();
    } else {
      router.push(`/tags/${anchorCluster}`);
    }
  }

  const onChangeType = function (event: ChangeEvent<HTMLInputElement>, type: string) {
    setLink({ ...link, type: type })
  }

  return (
    <Layout title="Link loom">
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
    </Layout >
  )
}

async function getOtherIdentity(anchor: ITag): Promise<string | undefined> {
  const tagsParams = { coref: anchor.cluster, linked: false, limit: 1 };
  const tags = await fetchJson<IListingResponse<ICluster>>('/clusters', tagsParams);
  if (tags.results.length > 0) {
    const reftag = tags.results[0];
    return reftag.id;
  }
  return undefined;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const anchorId = context.query.anchor as (string | undefined);
  if (anchorId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const anchor = await fetchJson<ITag>(`/tags/${anchorId}`)

  let otherId = context.query.other as (string | undefined);
  const autoMode = !otherId;
  if (autoMode) {
    otherId = await getOtherIdentity(anchor);
  }
  if (otherId === undefined) {
    return { redirect: { destination: `/tags/${anchorId}`, permanent: false } };
  }
  const other = await fetchJson<ITag>(`/tags/${otherId}`);
  const linkTypes = await fetchJson<IListingResponse<ILinkType>>('/linktypes')
  const existingParams = { cluster: [anchor.cluster, other.cluster], limit: 1 };
  const existingLink = await fetchJson<IListingResponse<ILink>>('/links', existingParams);
  let initialType = other.fingerprint === anchor.fingerprint ? 'SAME' : 'UNRELATED';
  for (let link of existingLink.results) {
    initialType = link.type;
  }
  return {
    props: { anchor, other, autoMode, linkTypes: linkTypes.results, initialType }
  }
}
