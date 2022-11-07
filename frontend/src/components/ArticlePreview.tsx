import { useFetchArticleQuery } from "../services/articles"
import ArticleText from "./ArticleText";

type ArticlePreviewProps = {
  articleId: string,
  tags: string[][]
}

export default function ArticlePreview({ articleId, tags }: ArticlePreviewProps) {
  const { data, isLoading } = useFetchArticleQuery(articleId);
  if (isLoading || data === undefined) {
    return null;
  }

  return (
    <div>
      <h3>{data.title}</h3>
      <ArticleText text={data.text} tags={tags} />
    </div>
  )
};