import { HTMLTable } from "@blueprintjs/core";
import { MouseEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useNodeTypes } from "../selectors";
import { useFetchStoryPairsQuery } from "../services/stories";
import { IClusterBase, IStory } from "../types";
import { getClusterLink, useListingPagination } from "../util";
import ClusterDrawer from "./ClusterDrawer";
import Pagination from "./Pagination";
import PairLink from "./PairLink";
import { ErrorSection, Numeric, SectionLoading, ClusterTypeIcon } from "./util";

type StoryPairsProps = {
  story: IStory,
}

export default function StoryPairs({ story }: StoryPairsProps) {
  const nodeTypes = useNodeTypes();
  const [showCluster, setShowCluster] = useState("");
  const page = useListingPagination('pairs');
  const { data: clusters, error: clustersError } = useFetchStoryPairsQuery({
    storyId: story.id,
    params: { ...page, types: nodeTypes }
  });

  if (clustersError !== undefined) {
    return <ErrorSection title="Could not load story-related entity pairs" />
  }
  if (clusters === undefined) {
    return <SectionLoading />
  }

  const onPreview = (e: MouseEvent<HTMLAnchorElement>, cluster: IClusterBase) => {
    setShowCluster(cluster.id);
    e.preventDefault();
  }

  return (
    <>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Links</th>
            <th className="numeric">Articles</th>
          </tr>
        </thead>
        <tbody>
          {clusters.results.map((pair) => (
            <tr key={pair.left.id + pair.right.id}>
              <td>
                <ClusterTypeIcon type={pair.left.type} size={14} />
                <Link to={getClusterLink(pair.left)} onClick={(e) => onPreview(e, pair.left)}>{pair.left.label}</Link>
              </td>
              <td>
                <ClusterTypeIcon type={pair.right.type} size={14} />
                <Link to={getClusterLink(pair.right)} onClick={(e) => onPreview(e, pair.right)}>{pair.right.label}</Link>
              </td>
              <td>
                <PairLink left={pair.left} right={pair.right} link_types={pair.link_types} story={story.id} />
              </td>
              <td className="numeric">
                <Numeric value={pair.articles} />
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <Pagination prefix='pairs' response={clusters} />
      <ClusterDrawer
        isOpen={showCluster.length > 0}
        clusterId={showCluster}
        onClose={(e) => setShowCluster("")}
      />
    </>
  )
};