import { HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useNodeTypes } from "../selectors";
import { useFetchStoryPairsQuery } from "../services/stories";
import { IStory } from "../types";
import { getClusterLink, useListingPagination } from "../util";
import Pagination from "./Pagination";
import PairLink from "./PairLink";
import { ErrorSection, Numeric, SectionLoading, ClusterTypeIcon } from "./util";

type StoryPairsProps = {
  story: IStory,
}

export default function StoryPairs({ story }: StoryPairsProps) {
  const nodeTypes = useNodeTypes();
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
                <Link to={getClusterLink(pair.left)}>{pair.left.label}</Link>
              </td>
              <td>
                <ClusterTypeIcon type={pair.right.type} size={14} />
                <Link to={getClusterLink(pair.right)}>{pair.right.label}</Link>
              </td>
              <td>
                <PairLink left={pair.left} right={pair.right} link_types={pair.link_types} />
              </td>
              <td className="numeric">
                <Numeric value={pair.articles} />
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <Pagination prefix='pairs' response={clusters} />
    </>
  )
};