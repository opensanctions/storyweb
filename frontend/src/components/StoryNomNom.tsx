import { Button, ButtonGroup, Intent, NonIdealState } from "@blueprintjs/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ARTICLE_ICON, ARTICLE_THRESHOLD } from "../constants";
import { IStory } from "../types";
import StoryArticleImportDialog from "./StoryArticleImportDialog";

import styles from '../styles/Story.module.scss';

type StoryNomNomProps = {
  story: IStory,
}

export default function StoryNomNom({ story }: StoryNomNomProps) {
  const [showImport, setShowImport] = useState(false);
  const navigate = useNavigate();

  const onImportClose = () => {
    setShowImport(false);
    navigate(0);
  }

  return (
    <>
      <NonIdealState
        icon={ARTICLE_ICON}
        className={styles.nomNom}
        title={`Add ${ARTICLE_THRESHOLD} articles to your story`}
        description="In order to build a story web, we need some reporting. Please add several pieces of news reporting to this story to collect entity information."
        action={
          <ButtonGroup>
            <Button intent={Intent.PRIMARY} icon="add" onClick={() => setShowImport(true)}>Add by URL</Button>
            <Button icon="box" onClick={() => navigate("/articles")}>Select from archive...</Button>
          </ButtonGroup>
        }
      />
      <StoryArticleImportDialog storyId={story.id} isOpen={showImport} onClose={onImportClose} />
    </>
  )
};