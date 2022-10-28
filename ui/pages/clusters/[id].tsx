import type { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router';
import { Tab, Tabs } from '@blueprintjs/core';
import { useEffect, useState } from 'react';
import queryString from 'query-string';

import Layout from '../../components/Layout'
import { IListingResponse, IClusterDetails, IRelatedCluster, ISimilarCluster } from '../../lib/types';
import { SpacedList, Spacer, TagCategory, TagLabel } from '../../components/util';
import { fetchJson } from '../../lib/data';
import SimilarListing from '../../components/SimilarListing';
import RelatedListing from '../../components/RelatedListing';

interface ClusterViewProps {
  cluster: IClusterDetails
  related: IListingResponse<IRelatedCluster>
  similar: IListingResponse<ISimilarCluster>
}

export default function ClusterView({ cluster, related, similar }: ClusterViewProps) {
  const router = useRouter();
  const [view, setView] = useState('related');

  useEffect(() => {
    const hash = queryString.parse(window?.location.hash);
    setView(hash.view as string || view);
  }, [router.asPath]);

  const onTabChange = (newTabId: string) => {
    window.location.hash = queryString.stringify({ view: newTabId });
    setView(newTabId);
  }

  return (
    <Layout title={cluster.label}>
      <h1>
        <TagLabel label={cluster.label} />
      </h1>
      <p>
        <TagCategory category={cluster.category} /> <Spacer />
        Aliases:{' '}
        <SpacedList values={cluster.labels.map((l) => <TagLabel key={l} label={l} />)} />
      </p>
      <Tabs selectedTabId={view} onChange={onTabChange}>
        <Tab id="related" title="Related" panel={<RelatedListing cluster={cluster} response={related} />} />
        {similar.results.length > 0 && (
          <Tab id="similar" title="Similar" panel={<SimilarListing cluster={cluster} response={similar} />} />
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
