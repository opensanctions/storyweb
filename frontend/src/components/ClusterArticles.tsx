import { Button, HTMLTable } from "@blueprintjs/core";
import { MouseEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFetchArticleListingQuery } from "../services/articles";
import { useUntagArticleMutation } from "../services/links";
import { IArticle, IClusterDetails } from "../types";
import ArticleDrawer from "./ArticleDrawer";
import { SectionLoading } from "./util";

type ClusterArticlesProps = {
  cluster: IClusterDetails,
}

export default function ClusterArticles({ cluster }: ClusterArticlesProps) {
  const query = { cluster: cluster.id };
  const { data: listing, isLoading } = useFetchArticleListingQuery(query);
  const [params, setParams] = useSearchParams();
  const [untagArticleMutation, { isLoading: isUntagging }] = useUntagArticleMutation();
  const articleId = params.get('article') || '';

  if (listing === undefined || isLoading || isUntagging) {
    return <SectionLoading />
  }

  const showArticle = (e: MouseEvent<HTMLAnchorElement>, articleId: string) => {
    e.preventDefault();
    setArticle(articleId);
  }

  const setArticle = (articleId: string) => {
    const paramsObj = Object.fromEntries(params.entries());
    setParams({ ...paramsObj, article: articleId });
  }

  const untagArticle = async (article: IArticle) => {
    await untagArticleMutation({ cluster: cluster.id, article: article.id }).unwrap()
  }

  return (
    <>
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
                  onClick={(e) => showArticle(e, article.id)}
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
      <ArticleDrawer
        isOpen={articleId !== null && articleId.length > 1}
        onClose={(e) => setArticle('')}
        articleId={articleId || ''}
        tags={[[cluster.label, ...cluster.labels]]}
      />
    </>
  )
}