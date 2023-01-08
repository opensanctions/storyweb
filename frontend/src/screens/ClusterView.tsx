import { useParams } from "react-router-dom";
import { Tabs, Tab } from "@blueprintjs/core";

import RelatedListing from "../components/RelatedListing";
import SimilarListing from "../components/SimilarListing";
import { ErrorSection, SectionLoading, SpacedList, Spacer, TagType, ClusterLabel } from "../components/util";
import { useFetchClusterQuery } from "../services/clusters";
import ClusterArticles from "../components/ClusterArticles";
import ScreenHeading from "../components/ScreenHeading";
import ClusterButtonGroup from "../components/ClusterButtonGroup";

export default function ClusterView() {
  const { clusterId } = useParams();
  const { data: cluster, isLoading, error } = useFetchClusterQuery(clusterId as string);
  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (cluster === undefined || isLoading) {
    return <SectionLoading />
  }
  return (
    <div>
      <ScreenHeading title={<ClusterLabel label={cluster.label} />}>
        <ClusterButtonGroup cluster={cluster} />
      </ScreenHeading>
      <p>
        <TagType type={cluster.type} /> <Spacer />
        Aliases:{' '}
        <SpacedList values={cluster.labels.map((l) => <ClusterLabel key={l} label={l} />)} />
      </p>
      <Tabs>
        <Tab id="related" title="Related" panel={<RelatedListing cluster={cluster} />} />
        <Tab id="similar" title="Similar" panel={<SimilarListing cluster={cluster} />} />
        <Tab id="articles" title="Articles" panel={<ClusterArticles cluster={cluster} />} />
      </Tabs>
    </div>
  )
}
