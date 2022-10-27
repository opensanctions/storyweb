import type { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router';
import Link from 'next/link';

import Layout from '../components/Layout'
import { ILink, ILinkType, IListingResponse, ICluster } from '../lib/types';
import { FormEvent, useState } from 'react';
import { getClusterLink } from '../lib/util';
import { fetchJson } from '../lib/data';
import { Button, RadioGroup } from '@blueprintjs/core';

interface IPageProps {
  initialType: string
  anchor: ICluster
  other: ICluster
  autoMode: boolean
  linkTypes: ILinkType[]
}

export default function LinkLoom({ anchor, other, linkTypes, autoMode, initialType }: IPageProps) {
  const router = useRouter();
  const [link, setLink] = useState({
    source: anchor.id,
    source_cluster: anchor.id,
    target: other.id,
    target_cluster: other.id,
    type: initialType
  } as ILink);
  const linkType = linkTypes.find((lt) => lt.name == link.type) || linkTypes[0]
  const linkOptions = linkTypes.map(l => ({ value: l.name, label: l.label }));

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
      router.push(`/clusters/${anchorCluster}`);
    }
  }

  const onChangeType = function (event: FormEvent<HTMLInputElement>) {
    setLink({ ...link, type: event.currentTarget.value })
  }

  return (
    <Layout title="Link loom">
      <h2>
        <code>
          <Link href={getClusterLink(anchor)}>{anchor.label}</Link>
        </code>
        {' '}
        {linkType.phrase}
        {' '}
        <code>
          <Link href={getClusterLink(other)}>{other.label}</Link>
        </code>
      </h2>
      <form onSubmit={onSubmit}>
        <RadioGroup
          label="Link type"
          name="type"
          onChange={onChangeType}
          selectedValue={link.type}
          options={linkOptions}
        >
        </RadioGroup>
        <Button type="submit">Save</Button>
      </form>
    </Layout >
  )
}

async function getOtherIdentity(anchor: ICluster): Promise<string | undefined> {
  const params = { linked: false, limit: 1 };
  const path = `/clusters/${anchor.id}/related`;
  const related = await fetchJson<IListingResponse<ICluster>>(path, params);
  if (related.results.length > 0) {
    return related.results[0].id;
  }
  return undefined;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const anchorId = context.query.anchor as (string | undefined);
  if (anchorId === undefined) {
    return { redirect: { destination: '/clusters', permanent: false } };
  }
  const anchor = await fetchJson<ICluster>(`/clusters/${anchorId}`)

  let otherId = context.query.other as (string | undefined);
  const autoMode = !otherId;
  if (autoMode) {
    otherId = await getOtherIdentity(anchor);
  }
  if (otherId === undefined) {
    return { redirect: { destination: `/clusters/${anchorId}`, permanent: false } };
  }
  const other = await fetchJson<ICluster>(`/clusters/${otherId}`);
  const linkTypesResponse = await fetchJson<IListingResponse<ILinkType>>('/linktypes')
  const linkTypes = linkTypesResponse.results;
  const existingParams = { cluster: [anchor.id, other.id], limit: 1 };
  const existingLink = await fetchJson<IListingResponse<ILink>>('/links', existingParams);
  let initialType = other.label === anchor.label ? 'SAME' : 'UNRELATED';
  for (let link of existingLink.results) {
    initialType = link.type;
  }
  return {
    props: { anchor, other, autoMode, linkTypes, initialType }
  }
}
