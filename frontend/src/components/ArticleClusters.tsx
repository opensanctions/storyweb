import { HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useFetchClusterListingQuery } from "../services/clusters";
import { IArticle } from "../types";
import { getClusterLink } from "../util";
import { ClusterLabel, ClusterTypeIcon, ErrorSection, SectionLoading } from "./util";

type ArticleClustersProps = {
  article: IArticle
}

export default function ArticleClusters({ article }: ArticleClustersProps) {
  const query = { article: article.id, limit: 100 };
  const { data: clusters, isLoading, error: clustersError } = useFetchClusterListingQuery(query);
  if (clustersError) {
    return <ErrorSection title="Could not load the article" />
  }
  if (isLoading || clusters === undefined) {
    return <SectionLoading />;
  }

  return (
    <HTMLTable condensed bordered className="wide">
      <thead>
        <tr>
          <th>
            Name
          </th>
        </tr>
      </thead>
      <tbody>
        {clusters.results.map((cluster) =>
          <tr key={cluster.id}>
            <td>
              <ClusterTypeIcon type={cluster.type} size={14} />
              <Link to={getClusterLink(cluster)}>
                <ClusterLabel label={cluster.label} />
              </Link>
            </td>

          </tr>
        )}
      </tbody>
    </HTMLTable>
  )
};