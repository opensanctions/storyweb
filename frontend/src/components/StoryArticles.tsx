import { Button, HTMLTable } from "@blueprintjs/core";
import { MouseEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ARTICLE_THRESHOLD } from "../constants";
import { useFetchArticleListingQuery } from "../services/articles";
import { useToggleStoryArticleMutation } from "../services/stories";
import { IArticle, IStory } from "../types";
import { useListingPagination } from "../util";
import ArticleDrawer from "./ArticleDrawer";
import Pagination from "./Pagination";
import StoryNomNom from "./StoryNomNom";
import { ErrorSection, SectionLoading } from "./util";

type StoryArticlesProps = {
  story: IStory,
}

export default function StoryArticles({ story }: StoryArticlesProps) {
  const [params, setParams] = useSearchParams();
  const articleId = params.get('article') || undefined;
  const page = useListingPagination('pairs');
  const { data: articles, error, isLoading } = useFetchArticleListingQuery({ ...page, story: story.id });
  const [toggleStoryArticle] = useToggleStoryArticleMutation();

  if (error !== undefined) {
    return <ErrorSection title="Could not load story-related articles" />
  }
  if (articles === undefined || isLoading) {
    return <SectionLoading />
  }

  const onRemoveArticle = async (article: IArticle) => {
    if (story !== undefined) {
      await toggleStoryArticle({ story: story.id, article: article.id }).unwrap()
    }
  }

  const setPreviewArticle = (articleId?: string) => {
    const paramsObj = Object.fromEntries(params.entries());
    setParams({ ...paramsObj, article: articleId || '' });
  }

  const onPreviewArticle = (event: MouseEvent<HTMLAnchorElement>, article: IArticle) => {
    event.preventDefault();
    setPreviewArticle(article.id)
  }

  return (
    <>
      {(articles.total < ARTICLE_THRESHOLD) && (
        <StoryNomNom story={story} />
      )}
      {articles.results.length > 0 && (
        <>
          <HTMLTable condensed bordered className="wide">
            <thead>
              <tr>
                <th>Title</th>
                <th>Site</th>
                <th style={{ width: '1%' }} className="numeric">Remove</th>
              </tr>
            </thead>
            <tbody>
              {articles.results.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link
                      to={`/articles?article=${article.id}`}
                      onClick={(e) => onPreviewArticle(e, article)}
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td>{article.site}</td>
                  <td className="numeric">
                    <Button
                      onClick={() => onRemoveArticle(article)}
                      icon="trash"
                      minimal
                      small
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
          <Pagination prefix='articles' response={articles} />
        </>
      )}
      <ArticleDrawer
        onClose={(e) => setPreviewArticle(undefined)}
        articleId={articleId}
        tags={[]}
      />
    </>
  )
};