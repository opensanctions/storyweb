import { HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useFetchClusterListingQuery } from "../services/clusters";
import { getClusterLink } from "../util";
import { ErrorSection, Numeric, SectionLoading, TagType } from "./util";

type StoryClustersProps = {
  storyId: number,
}

export default function StoryClusters({ storyId }: StoryClustersProps) {
  const { data: clusters, error: clustersError } = useFetchClusterListingQuery({
    story: storyId,
    limit: 1000
  });

  if (clustersError !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (clusters === undefined) {
    return <SectionLoading />
  }

  return (
    <HTMLTable condensed bordered className="wide">
      <thead>
        <tr>
          <th>Label</th>
          <th>Type</th>
          <th className="numeric">Articles</th>
        </tr>
      </thead>
      <tbody>
        {clusters.results.map((cluster) => (
          <tr key={cluster.id}>
            <td>
              <Link to={getClusterLink(cluster)}>{cluster.label}</Link>
            </td>
            <td><TagType type={cluster.type} /></td>
            <td className="numeric">
              <Numeric value={cluster.articles} />
            </td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  )
};