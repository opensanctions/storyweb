import type { GetServerSidePropsContext } from 'next'
import Link from 'next/link';

import Layout from '../../components/Layout'
import { ITag, IListingResponse, ICluster, IClusterDetails, IRelatedCluster, ISimilarCluster } from '../../lib/types';

import { getClusterLink, getLinkLoomLink } from '../../lib/util';
import { SpacedList, TagCategory, TagLabel } from '../../components/util';
import { fetchJson } from '../../lib/data';
import { HTMLTable, Tab, Tabs } from '@blueprintjs/core';
import SimilarListing from '../../components/SimilarListing';
import RelatedListing from '../../components/RelatedListing';

interface TagProps {
  cluster: IClusterDetails
  related: IListingResponse<IRelatedCluster>
  similar: IListingResponse<ISimilarCluster>
}

export default function ClusterView({ cluster, related, similar }: TagProps) {
  return (
    <Layout title={cluster.label}>
      <h1>
        <TagLabel label={cluster.label} />
      </h1>
      <p>
        <TagCategory category={cluster.category} />
      </p>
      <p>
        Aliases:{' '}
        <SpacedList values={cluster.labels.map((l) => <TagLabel key={l} label={l} />)} />
      </p>
      <p>
        <Link href={getLinkLoomLink(cluster)}>Start matching</Link>
      </p>
      <Tabs>
        <Tab id="ng" title="Related" panel={<RelatedListing cluster={cluster} response={related} />} />
        {similar.results.length > 0 && (
          <Tab id="rx" title="Similar" panel={<SimilarListing cluster={cluster} response={similar} />} />
        )}
      </Tabs>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const clusterId = context.params?.id as (string | undefined);
  if (clusterId === undefined) {
    return { redirect: { destination: '/tags', permanent: false } };
  }
  const cluster = await fetchJson<IClusterDetails>(`/clusters/${clusterId}`);
  if (clusterId !== cluster.id) {
    return { redirect: { destination: `/clusters/${cluster.id}`, permanent: false } };
  }
  const relatedPath = `/clusters/${cluster.id}/related`;
  const related = await fetchJson<IListingResponse<IRelatedCluster>>(relatedPath);

  const similarPath = `/clusters/${cluster.id}/similar`;
  const similar = await fetchJson<IListingResponse<ISimilarCluster>>(similarPath);
  return {
    props: { cluster, related, similar },
  }
}
