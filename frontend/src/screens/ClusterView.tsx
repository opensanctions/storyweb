import { redirect, useNavigate, useParams } from "react-router-dom";
import { Tabs, Tab } from "@blueprintjs/core";

import RelatedListing from "../components/RelatedListing";
import SimilarListing from "../components/SimilarListing";
import { ErrorSection, SectionLoading, SpacedList, Spacer, TagType, TagLabel } from "../components/util";
import { useFetchClusterQuery } from "../services/clusters";
import ClusterArticles from "../components/ClusterArticles";
import { getClusterLink } from "../util";

export default function ClusterView() {
  const { clusterId } = useParams();
  // const navigate = useNavigate();
  const { data: cluster, isLoading, error } = useFetchClusterQuery(clusterId as string);
  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (cluster === undefined || isLoading) {
    return <SectionLoading />
  }
  // if (cluster.id != clusterId) {
  //   navigate(getClusterLink(cluster));
  // }
  return (
    <div>
      <h1>
        <TagLabel label={cluster.label} />
      </h1>
      <p>
        <TagType type={cluster.type} /> <Spacer />
        Aliases:{' '}
        <SpacedList values={cluster.labels.map((l) => <TagLabel key={l} label={l} />)} />
      </p>
      <Tabs>
        <Tab id="related" title="Related" panel={<RelatedListing cluster={cluster} />} />
        <Tab id="similar" title="Similar" panel={<SimilarListing cluster={cluster} />} />
        <Tab id="articles" title="Articles" panel={<ClusterArticles cluster={cluster} />} />
      </Tabs>
    </div>
  )
}
