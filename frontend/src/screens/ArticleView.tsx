import { useParams } from "react-router-dom"
import ArticleText from "../components/ArticleText";
import { ErrorSection, SectionLoading, Spacer } from "../components/util";
import { useFetchArticleQuery } from "../services/articles"

export default function ArticleView() {
  const { articleId } = useParams();
  const { data: article, error } = useFetchArticleQuery(articleId as string);
  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (article === undefined) {
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
      <ArticleText text={article.text} tags={[['OCCRP'], ['Bank']]} />
    </div>
  )
}
