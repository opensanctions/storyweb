import { Button, HTMLTable } from "@blueprintjs/core";
import { useState } from "react";
import { ARTICLE_THRESHOLD } from "../constants";
import { useFetchArticleListingQuery } from "../services/articles";
import { useToggleStoryArticleMutation } from "../services/stories";
import { IArticle, IStory } from "../types";
import ArticleDrawer from "./ArticleDrawer";
import StoryNomNom from "./StoryNomNom";
import { ErrorSection, SectionLoading } from "./util";

type StoryArticlesProps = {
  story: IStory,
}

export default function StoryArticles({ story }: StoryArticlesProps) {
  const [previewArticle, setPreviewArticle] = useState('');
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
      {(articles.total < ARTICLE_THRESHOLD) && (
        <StoryNomNom story={story} />
      )}
      {articles.results.length > 0 && (
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
                  <a onClick={() => setPreviewArticle(article.id)}>
                    {article.title}
                  </a>
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
      )}
      <ArticleDrawer
        isOpen={previewArticle.length > 1}
        onClose={(e) => setPreviewArticle('')}
        articleId={previewArticle}
        tags={[]}
      />
    </>
  )
};