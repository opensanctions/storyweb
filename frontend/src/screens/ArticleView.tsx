import { useParams } from "react-router-dom"

export default function ArticleView() {
  const params = useParams()


  return (
    <div>
      <h1>
        <>
          An article: {params.articleId}
        </>
      </h1>
    </div>
  )
}
