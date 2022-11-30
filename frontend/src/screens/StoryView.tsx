import { Button, HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ErrorSection, SectionLoading } from "../components/util";
import { useFetchArticleListingQuery } from "../services/articles";
import { useFetchStoryQuery, useToggleStoryArticleMutation } from "../services/stories";
import { IArticle } from "../types";

export default function StoryView() {
  const { storyId } = useParams();
  const { data: story, isLoading, error } = useFetchStoryQuery(storyId as string);
  const { data: articleListing } = useFetchArticleListingQuery({ story: storyId });
  const [toggleStoryArticle] = useToggleStoryArticleMutation();
  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (story === undefined || isLoading || articleListing === undefined) {
    return <SectionLoading />
  }

  const onRemoveArticle = async (article: IArticle) => {
    if (story !== undefined) {
      await toggleStoryArticle({ story: story.id, article: article.id }).unwrap()
    }
  }

  return (
    <div>
      <h1>
        {story.title}
      </h1>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Title</th>
            <th>Site</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {articleListing.results.map((article) => (
            <tr key={article.id}>
              <td>
                <Link to={`/articles/${article.id}`}>
                  {article.title}
                </Link>
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
    </div>
  )
}
