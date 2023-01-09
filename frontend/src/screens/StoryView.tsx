import { AnchorButton, Button, Icon, IconSize, Intent, Tab, Tabs } from "@blueprintjs/core";
import { useState } from "react";
import { useParams } from "react-router-dom";
import ScreenHeading from "../components/ScreenHeading";
import StoryArticleImportDialog from "../components/StoryArticleImportDialog";
import StoryArticles from "../components/StoryArticles";
import StoryDeleteDialog from "../components/StoryDeleteDialog";
import StoryGraph from "../components/StoryGraph";
import StoryPairs from "../components/StoryPairs";
import StoryUpdateDialog from "../components/StoryUpdateDialog";
import { ErrorSection, NumericTag, SectionLoading } from "../components/util";
import { ARTICLE_ICON, LINKER_ICON, STORY_ICON } from "../constants";
import { useFetchArticleListingQuery } from "../services/articles";
import { useFetchStoryQuery } from "../services/stories";

export default function StoryView() {
  const { storyId } = useParams();
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { data: story, isLoading, error } = useFetchStoryQuery(storyId as string);
  const { data: articles } = useFetchArticleListingQuery({ story: storyId });

  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (story === undefined || isLoading) {
    return <SectionLoading />
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
      <Tabs id="storyView">
        <Tab id="graph"
          title={
            <>
              Network graph
              <NumericTag value={0} className="tab-tag" />
            </>
          }
          panel={<StoryGraph story={story} />}
        />
        <Tab id="pairs"
          title={
            <>
              Co-occurring entities
              <NumericTag value={0} className="tab-tag" />
            </>
          }
          panel={<StoryPairs story={story} />}
        />
        <Tab id="articles"
          title={
            <>
              Articles
              <NumericTag value={articles?.total} className="tab-tag" />
            </>
          }
          panel={<StoryArticles story={story} />}
        />
      </Tabs>
    </div >
  )
}
