import { Button, HTMLTable } from "@blueprintjs/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNodeTypes } from "../selectors";
import { useFetchArticleListingQuery } from "../services/articles";
import { useFetchStoryPairsQuery, useToggleStoryArticleMutation } from "../services/stories";
import { IArticle, IStory } from "../types";
import { getClusterLink } from "../util";
import ArticleDrawer from "./ArticleDrawer";
import PairLink from "./PairLink";
import { ErrorSection, Numeric, SectionLoading, ClusterTypeIcon } from "./util";

type StoryArticlesProps = {
  story: IStory,
}

export default function StoryArticles({ story }: StoryArticlesProps) {
  const [previewArticle, setPreviewArticle] = useState('')
  const { data: articles, error, isLoading } = useFetchArticleListingQuery({ story: story.id });
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

  return (
    <>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Title</th>
            <th>Site</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {articles.results.map((article) => (
            <tr key={article.id}>
              <td>
                <a onClick={() => setPreviewArticle(article.id)}>
                  {article.title}
                </a>
              </td>
              <td>{article.site}</td>
              <td>
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
      <ArticleDrawer
        isOpen={previewArticle.length > 1}
        onClose={(e) => setPreviewArticle('')}
        articleId={previewArticle}
        tags={[]}
      />
    </>
  )
};