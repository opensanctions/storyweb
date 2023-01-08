import { AnchorButton, Button, ButtonGroup, HTMLTable, Icon, IconSize, Intent } from "@blueprintjs/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import ScreenHeading from "../components/ScreenHeading";
import StoryArticleImportDialog from "../components/StoryArticleImportDialog";
import StoryDeleteDialog from "../components/StoryDeleteDialog";
import StoryGraph from "../components/StoryGraph";
import StoryPairs from "../components/StoryPairs";
import StoryUpdateDialog from "../components/StoryUpdateDialog";
import { ErrorSection, SectionLoading } from "../components/util";
import { ARTICLE_ICON, LINKER_ICON, STORY_ICON } from "../constants";
import { useFetchArticleListingQuery } from "../services/articles";
import { useFetchStoryQuery, useToggleStoryArticleMutation } from "../services/stories";
import { IArticle } from "../types";

export default function StoryView() {
  const { storyId } = useParams();
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
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
      <ScreenHeading title={<><Icon icon={STORY_ICON} size={IconSize.LARGE} /> {story.title}</>}>
        <AnchorButton intent={Intent.PRIMARY} icon={LINKER_ICON} href={`/stories/${story.id}/linker`}>
          Build web
        </AnchorButton>
        <Button icon={ARTICLE_ICON} intent={Intent.PRIMARY} onClick={() => setShowImport(true)}>
          Add article
        </Button>
        <StoryArticleImportDialog storyId={story.id} isOpen={showImport} onClose={() => setShowImport(false)} />
        <Button intent={Intent.NONE} icon="edit" onClick={() => setShowEdit(true)}>
          Edit
        </Button>
        <StoryUpdateDialog isOpen={showEdit} onClose={() => setShowEdit(false)} story={story} />
        <Button intent={Intent.DANGER} icon="trash" onClick={() => setShowDelete(true)}>
          Delete
        </Button>
        <StoryDeleteDialog isOpen={showDelete} onClose={() => setShowDelete(false)} story={story} />
      </ScreenHeading>
      <StoryGraph storyId={story.id} />
      <h3>Co-occurring entities</h3>
      <StoryPairs storyId={story.id} />
      <h3>Articles</h3>
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
    </div >
  )
}
