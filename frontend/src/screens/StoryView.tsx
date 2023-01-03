import { AnchorButton, Button, ButtonGroup, HTMLTable, Intent } from "@blueprintjs/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import StoryArticleImportDialog from "../components/StoryArticleImportDialog";
import StoryDeleteDialog from "../components/StoryDeleteDialog";
import StoryGraph from "../components/StoryGraph";
import StoryPairs from "../components/StoryPairs";
import { ErrorSection, SectionLoading } from "../components/util";
import { useFetchArticleListingQuery } from "../services/articles";
import { useFetchStoryQuery, useToggleStoryArticleMutation } from "../services/stories";
import { IArticle } from "../types";

export default function StoryView() {
  const { storyId } = useParams();
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
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
      <Button intent={Intent.DANGER} icon="trash" onClick={() => setShowDelete(true)}>Delete</Button>
      <StoryDeleteDialog isOpen={showDelete} onClose={() => setShowDelete(false)} story={story} />
      <StoryGraph storyId={story.id} />
      <h3>Co-occurring entities</h3>
      <section>
        <ButtonGroup>
          <AnchorButton icon="new-link" href={`/stories/${story.id}/linker`}>Link tool</AnchorButton>
        </ButtonGroup>
      </section>
      <StoryPairs storyId={story.id} />
      <h3>Articles</h3>
      <section>
        <Button intent={Intent.PRIMARY} onClick={() => setShowImport(true)}>Import article...</Button>
        <StoryArticleImportDialog storyId={story.id} isOpen={showImport} onClose={() => setShowImport(false)} />
      </section>
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
