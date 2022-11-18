import { Button, HTMLTable } from "@blueprintjs/core";
import { MouseEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFetchArticleListingQuery } from "../services/articles";
import { useUntagArticleMutation } from "../services/links";
import { IArticle, IClusterDetails } from "../types";
import ArticlePreview from "./ArticlePreview";
import { SectionLoading } from "./util";

type ClusterArticlesProps = {
  cluster: IClusterDetails,
}

export default function ClusterArticles({ cluster }: ClusterArticlesProps) {
  const query = { cluster: cluster.id };
  const { data: listing, isLoading } = useFetchArticleListingQuery(query);
  const [params, setParams] = useSearchParams();
  const [untagArticleMutation, { isLoading: isUntagging }] = useUntagArticleMutation();
  const articleId = params.get('article');

  // useEffect(() => {
  //   const paramsObj = Object.fromEntries(params.entries());
  //   if (listing !== undefined && articleId === null && listing.results.length > 0) {
  //     setParams({ ...paramsObj, article: listing.results[0].id });
  //   }
  // }, [articleId, params, setParams])

  if (listing === undefined || isLoading || isUntagging) {
    return <SectionLoading />
  }

  const setArticle = (e: MouseEvent<HTMLAnchorElement>, article: IArticle) => {
    e.preventDefault();
    const paramsObj = Object.fromEntries(params.entries());
    setParams({ ...paramsObj, article: article.id });
  }

  const untagArticle = async (article: IArticle) => {
    await untagArticleMutation({ cluster: cluster.id, article: article.id }).unwrap()
  }

  return (
    <div className="page-column-area">
      <div className="page-column">
        <HTMLTable condensed bordered className="wide">
          <thead>
            <tr>
              <th>Title</th>
              <th>Site</th>
              <th>Split</th>
            </tr>
          </thead>
          <tbody>
            {listing.results.map((article) => (
              <tr key={article.id}>
                <td>
                  <Link
                    onClick={(e) => setArticle(e, article)}
                    to={`/articles/${article.id}`}
                  >
                    {article.title}
                  </Link>
                </td>
                <td>{article.site}</td>
                <td>
                  <Button
                    onClick={() => untagArticle(article)}
                    icon="unresolve"
                    minimal
                    small
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
        {/* <code>{listing.debug_msg}</code> */}
      </div>
      <div className="page-column">
        {articleId && <ArticlePreview articleId={articleId} tags={[[cluster.label, ...cluster.labels]]} />}
      </div>
    </div>
  )
}