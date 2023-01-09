import { useParams } from "react-router-dom";
import { Tabs, Tab, IconSize } from "@blueprintjs/core";

import RelatedListing from "../components/RelatedListing";
import SimilarListing from "../components/SimilarListing";
import { ErrorSection, SectionLoading, SpacedList, Spacer, ClusterType, ClusterLabel, ClusterTypeIcon, NumericTag } from "../components/util";
import { useFetchClusterQuery, useFetchSimilarClusterListingQuery, useFetchRelatedClusterListingQuery } from "../services/clusters";
import ClusterArticles from "../components/ClusterArticles";
import ScreenHeading from "../components/ScreenHeading";
import ClusterButtonGroup from "../components/ClusterButtonGroup";
import { useFetchArticleListingQuery } from "../services/articles";
import { useNodeTypes } from "../selectors";
import ScreenContent from "../components/ScreenContent";

export default function ClusterView() {
  const { clusterId } = useParams();
  const nodeTypes = useNodeTypes();
  const { data: cluster, isLoading, error } = useFetchClusterQuery(clusterId as string);
  const relatedQuery = { clusterId: clusterId || '', params: { types: nodeTypes } };
  const { data: related } = useFetchRelatedClusterListingQuery(relatedQuery)
  const similarQuery = { clusterId: clusterId || '', params: {} };
  const { data: similar } = useFetchSimilarClusterListingQuery(similarQuery);
  const articleQuery = { cluster: clusterId };
  const { data: articles } = useFetchArticleListingQuery(articleQuery);
  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (cluster === undefined || isLoading) {
    return <SectionLoading />
  }
  const title = <>
    <ClusterTypeIcon type={cluster.type} size={IconSize.LARGE} />
    <ClusterLabel label={cluster.label} />
  </>;
  return (
    <div>
      <ScreenHeading title={title}>
        <ClusterButtonGroup cluster={cluster} />
      </ScreenHeading>
      {/* <p>
        <ClusterType type={cluster.type} /> <Spacer />
        Aliases:{' '}
        <SpacedList values={cluster.labels.map((l) => <ClusterLabel key={l} label={l} />)} />
      </p> */}
      <Tabs id="clusterView">
        <Tab id="related"
          title={
            <>
              Co-occurring
              <NumericTag value={related?.total} className="tab-tag" />
            </>
          }
          panel={
            <ScreenContent>
              <RelatedListing cluster={cluster} />
            </ScreenContent>
          }
        />
        <Tab id="similar"
          title={
            <>
              Similar
              <NumericTag value={similar?.total} className="tab-tag" />
            </>
          }
          disabled={similar?.total === 0}
          panel={
            <ScreenContent>
              <SimilarListing cluster={cluster} />
            </ScreenContent>
          }
        />
        <Tab id="articles"
          title={
            <>
              Articles
              <NumericTag value={articles?.total} className="tab-tag" />
            </>
          }
          panel={
            <ScreenContent>
              <ClusterArticles cluster={cluster} />
            </ScreenContent>
          }
        />
      </Tabs>
    </div>
  )
}
