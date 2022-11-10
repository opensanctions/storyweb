import { useParams } from "react-router-dom"
import { ControlGroup, Classes, HTMLTable, Button } from '@blueprintjs/core';
import ArticleText from "../components/ArticleText";
import { ErrorSection, SectionLoading, Spacer, TagLabel, TagType } from "../components/util";
import { useFetchArticleQuery } from "../services/articles"
import { useFetchClusterListingQuery } from "../services/clusters";

export default function ArticleView() {
  const { articleId } = useParams();
  const { data: article, error: articleError } = useFetchArticleQuery(articleId as string);
  const { data: clusters, error: clustersError } = useFetchClusterListingQuery({
    article: articleId
  });
  if (articleError !== undefined || clustersError !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (article === undefined || clusters === undefined) {
    return <SectionLoading />
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
          <ArticleText text={article.text} tags={[['OCCRP'], ['Bank']]} />
        </div>
        <div className="page-column">
          <HTMLTable condensed bordered className="wide">
            {clusters.results.map((cluster) =>
              <tr key={cluster.id}>
                <td>
                  <TagLabel label={cluster.label} />
                </td>
                <td>
                  <TagType type={cluster.type} />
                </td>
              </tr>
            )}
          </HTMLTable>
        </div>
      </div>
    </div >
  )
}
