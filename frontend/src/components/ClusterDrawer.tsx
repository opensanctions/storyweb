import { Drawer, Tab, Tabs } from "@blueprintjs/core"
import { SyntheticEvent, useEffect, useState } from "react"
import { useFetchArticleListingQuery } from "../services/articles"
import { useFetchClusterQuery, useFetchRelatedClusterListingQuery, useFetchSimilarClusterListingQuery } from "../services/clusters"
import { ErrorSection, NumericTag, SectionLoading } from "./util"

import styles from '../styles/Cluster.module.scss'
import { useFetchOntologyQuery } from "../services/ontology"
import { useNodeTypes } from "../selectors"
import RelatedListing from "./RelatedListing"
import SimilarListing from "./SimilarListing"
import ClusterArticles from "./ClusterArticles"

type ClusterDrawerInnerProps = {
  clusterId: string,
  isOpen: boolean,
  onClose: (event: SyntheticEvent<HTMLElement>) => void
  onClosed: (node: HTMLElement) => void
}

function ClusterDrawerInner({ clusterId, isOpen, onClose }: ClusterDrawerInnerProps) {
  const nodeTypes = useNodeTypes();
  const { data: cluster, error: clusterError } = useFetchClusterQuery(clusterId);
  const relatedQuery = { clusterId: clusterId || '', params: { types: nodeTypes } };
  const { data: related } = useFetchRelatedClusterListingQuery(relatedQuery)
  const similarQuery = { clusterId: clusterId || '', params: {} };
  const { data: similar } = useFetchSimilarClusterListingQuery(similarQuery);
  const articleQuery = { cluster: clusterId };
  const { data: articles } = useFetchArticleListingQuery(articleQuery);
  const { data: ontology } = useFetchOntologyQuery();
  const meta = ontology?.cluster_types.find((t) => t.name === cluster?.type);
  const icon = meta?.icon || 'hat';
  const realIsOpen = isOpen && clusterId.trim().length > 1;

  return (
    <Drawer
      size={"40%"}
      isOpen={realIsOpen}
      onClose={onClose}
      icon={icon as any}
      hasBackdrop={false}
      autoFocus
      enforceFocus
      portalClassName="portal-z-top"
      title={cluster ? cluster.label : 'No entity'}
    >
      <div className={styles.clusterDrawer}>
        {(cluster === undefined) && (
          <SectionLoading />
        )}
        {(clusterError !== undefined) && (
          <ErrorSection title="Could not load the entity" />
        )}
        {cluster && (
          <Tabs id="clusterView">
            <Tab id="related"
              title={
                <>
                  Co-occurring
                  <NumericTag value={related?.total} className="tab-tag" />
                </>
              }
              panel={
                <RelatedListing cluster={cluster} />
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
                <SimilarListing cluster={cluster} />
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
                <ClusterArticles cluster={cluster} />
              }
            />
          </Tabs>
        )}
      </div>
    </Drawer >
  )
}



type ClusterDrawerProps = {
  clusterId?: string,
  onClose: (event: SyntheticEvent<HTMLElement>) => void
}

export default function ClusterDrawer({ clusterId, onClose }: ClusterDrawerProps) {
  const isOpen = !!clusterId;
  const [activeClusterId, setActiveClusterId] = useState<string | undefined>(clusterId);

  useEffect(() => {
    if (!!clusterId && clusterId !== activeClusterId) {
      setActiveClusterId(clusterId);
    }
  }, [clusterId, activeClusterId])

  const onClosed = () => {
    setActiveClusterId(undefined);
  }

  if (activeClusterId === undefined) {
    return null;
  }

  return (
    <ClusterDrawerInner
      clusterId={activeClusterId}
      onClose={onClose}
      onClosed={onClosed}
      isOpen={isOpen}
    />
  );
}