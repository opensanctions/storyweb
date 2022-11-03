import { useParams } from "react-router-dom"
import ArticleText from "../components/ArticleText";
import { Spacer } from "../components/util";
import { useFetchArticleQuery } from "../services/articles"

export default function ArticleView() {
  const { articleId } = useParams();
  const { data: article } = useFetchArticleQuery(articleId as string);
  if (article === undefined) {
    return null
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
