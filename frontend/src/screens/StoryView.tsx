import { AnchorButton, Button, Icon, IconSize, Intent, Tab, Tabs } from "@blueprintjs/core";
import { useState } from "react";
import { useParams } from "react-router-dom";
import ScreenContent from "../components/ScreenContent";
import ScreenHeading from "../components/ScreenHeading";
import StoryArticleImportDialog from "../components/StoryArticleImportDialog";
import StoryArticles from "../components/StoryArticles";
import StoryDeleteDialog from "../components/StoryDeleteDialog";
import StoryGraph from "../components/StoryGraph";
import StoryPairs from "../components/StoryPairs";
import StoryUpdateDialog from "../components/StoryUpdateDialog";
import { ErrorSection, NumericTag, SectionLoading } from "../components/util";
import { ARTICLE_ICON, ARTICLE_THRESHOLD, LINKER_ICON, LINKS_THRESHOLD, STORY_ICON } from "../constants";
import { useNodeTypes } from "../selectors";
import { useFetchArticleListingQuery } from "../services/articles";
import { useFetchStoryPairsQuery, useFetchStoryQuery } from "../services/stories";

export default function StoryView() {
  const { storyId } = useParams();
  const nodeTypes = useNodeTypes();
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { data: links } = useFetchStoryPairsQuery({
    storyId: storyId || '',
    params: { types: nodeTypes, limit: 0, linked: true }
  });
  const { data: story, isLoading, error } = useFetchStoryQuery(storyId as string);
  const { data: articles } = useFetchArticleListingQuery({ story: storyId, limit: 0 });

  const hasArticles = (articles?.total || 0) >= ARTICLE_THRESHOLD;
  const hasLinks = (links?.total || 0) >= LINKS_THRESHOLD;

  const secondaryTab = hasLinks ? 'graph' : 'pairs';
  const defaultTab = hasArticles ? secondaryTab : 'articles';

  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (story === undefined || articles === undefined || links === undefined || isLoading) {
    return <SectionLoading />
  }

  return (
    <div>
      <ScreenHeading title={<><Icon icon={STORY_ICON} size={IconSize.LARGE} /> {story.title}</>}>
        {(hasArticles || hasLinks) && (
          <AnchorButton intent={Intent.PRIMARY} icon={LINKER_ICON} href={`/stories/${story.id}/linker`}>
            Build web
          </AnchorButton>
        )}
        <Button icon={ARTICLE_ICON} intent={hasArticles ? Intent.NONE : Intent.PRIMARY} onClick={() => setShowImport(true)}>
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
      <Tabs id="storyView" defaultSelectedTabId={defaultTab} renderActiveTabPanelOnly>
        <Tab id="graph"
          title={
            <>
              Network graph
            </>
          }
          disabled={!hasLinks}
          panel={
            <ScreenContent>
              <StoryGraph story={story} />
            </ScreenContent>
          }
        />
        <Tab id="pairs"
          title={
            <>
              Links
              <NumericTag value={links?.total} className="tab-tag" />
            </>
          }
          disabled={!hasArticles}
          panel={
            <ScreenContent>
              <StoryPairs story={story} />
            </ScreenContent>
          }
        />
        <Tab id="articles"
          title={
            <>
              Articles
              <NumericTag value={articles?.total} className="tab-tag" />
            </>
          }
          panel={
            <ScreenContent>
              <StoryArticles story={story} />
            </ScreenContent>
          }
        />
      </Tabs>
    </div >
  )
}
