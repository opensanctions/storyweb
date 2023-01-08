import { Link, useParams, useSearchParams } from "react-router-dom"
import { Checkbox, HTMLTable } from '@blueprintjs/core';
import ArticleText from "../components/ArticleText";
import { ErrorSection, SectionLoading, Spacer, ClusterLabel, TagType } from "../components/util";
import { useFetchArticleQuery } from "../services/articles"
import { useFetchClusterListingQuery } from "../services/clusters";
import { getClusterLink, listToggle } from "../util";
import { ICluster } from "../types";

export default function ArticleView() {
  const { articleId } = useParams();
  const [params, setParams] = useSearchParams();
  let showClusters = params.getAll('show');
  const { data: article, error: articleError } = useFetchArticleQuery(articleId as string);
  const { data: clusters, error: clustersError } = useFetchClusterListingQuery({
    article: articleId,
    limit: 1000
  });
  if (articleError !== undefined || clustersError !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (article === undefined || clusters === undefined) {
    return <SectionLoading />
  }

  const tags = clusters.results
    .filter((c) => showClusters.indexOf(c.id) !== -1)
    .map((c) => [c.label]);
  const allSelected = tags.length === clusters.results.length;
  const someSelected = !allSelected && tags.length > 0;

  const toggleShowCluster = (cluster: ICluster) => {
    const nextClusters = listToggle(params.getAll('show'), cluster.id);
    console.log(nextClusters)
    setParams({ show: nextClusters });
  };

  const toggleAll = () => {
    if (allSelected) {
      setParams({ show: [] });
    } else {
      setParams({ show: clusters.results.map(c => c.id) });
    }
  }

  return (
    <div>
      <h1>
        {article.title}
      </h1>
      <p>
        Site: {article.site} <Spacer />
        <a href={article.url}>{article.url}</a>
      </p>
      <div className="page-column-area">
        <div className="page-column">
          <ArticleText text={article.text} tags={tags} />
        </div>
        <div className="page-column">
          <HTMLTable condensed bordered className="wide">
            <thead>
              <tr>
                <th>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => toggleAll()}
                  />
                </th>
                <th>
                  Name
                </th>
                <th>
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {clusters.results.map((cluster) =>
                <tr key={cluster.id}>
                  <td>
                    <Checkbox
                      checked={showClusters.indexOf(cluster.id) !== -1}
                      onChange={() => toggleShowCluster(cluster)}
                    />
                  </td>
                  <td>
                    <Link to={getClusterLink(cluster)}>
                      <ClusterLabel label={cluster.label} />
                    </Link>
                  </td>
                  <td>
                    <TagType type={cluster.type} />
                  </td>
                </tr>
              )}
            </tbody>
          </HTMLTable>
        </div>
      </div>
    </div >
  )
}
