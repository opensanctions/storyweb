import { Button, Intent, Menu, MenuItem } from "@blueprintjs/core";
import { Popover2, Classes as Popover2Classes } from "@blueprintjs/popover2";
import { MouseEvent } from "react";
import { useFetchStoryListingQuery, useToggleStoryArticleMutation } from "../services/stories";
import { IArticle, IStory } from "../types";

type ArticleStoryEditorContentProps = {
  article: IArticle
}

function ArticleStoryEditorContent({ article }: ArticleStoryEditorContentProps) {
  const { data: allListing } = useFetchStoryListingQuery({ limit: 100 });
  const { data: linkedListing } = useFetchStoryListingQuery({ limit: 100, article: article.id });
  const [toggleStoryArticle, { isLoading: isToggling }] = useToggleStoryArticleMutation();


  const linkedIds = linkedListing?.results.map((s) => s.id) || [];
  const onToggleAssign = async (e: MouseEvent, story: IStory) => {
    await toggleStoryArticle({ story: story.id, article: article.id }).unwrap();
  }

  return (
    <>
      {(allListing !== undefined) && (
        <Menu>
          {allListing.results.map((story) =>
            <MenuItem
              key={story.id}
              text={story.title}
              onClick={(e) => onToggleAssign(e, story)}
              intent={linkedIds.indexOf(story.id) === -1 ? Intent.NONE : Intent.SUCCESS}
              icon={linkedIds.indexOf(story.id) === -1 ? "small-minus" : "small-tick"}
            />
          )}
        </Menu>
      )}
    </>
  );
}


type ArticleStoryManagerProps = {
  article: IArticle
  inList: boolean
}

export default function ArticleStoryEditor({ article, inList }: ArticleStoryManagerProps) {
  return (
    <Popover2
      content={<ArticleStoryEditorContent article={article} />}
      interactionKind="click"
      popoverClassName={Popover2Classes.POPOVER2_CONTENT_SIZING}
      placement="auto"
    >
      <Button
        icon="add-to-artifact"
        minimal={inList}
        small={inList}
      />
    </Popover2 >
  )
}