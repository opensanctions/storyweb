import { Button, Callout, Classes, Dialog, Intent } from "@blueprintjs/core";
import { FormEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { STORY_ICON } from "../constants";
import { useDeleteStoryMutation } from "../services/stories";
import { IStory } from "../types";

type StoryCreateDialogProps = {
  story: IStory
  isOpen: boolean
  onClose: () => void
}

export default function StoryDeleteDialog({ isOpen, onClose, story }: StoryCreateDialogProps) {
  const navigate = useNavigate();
  const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryMutation();

  const onDelete = async (e: MouseEvent | FormEvent) => {
    e.preventDefault();
    await deleteStory(story.id).unwrap();
    navigate('/');
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} icon={STORY_ICON} title={`Delete story: ${story.title}`}>
      <form onSubmit={onDelete}>
        <div className={Classes.DIALOG_BODY}>
          <Callout intent={Intent.DANGER}>
            Are you sure you want to delete this story?
          </Callout>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button intent={Intent.DANGER} onClick={onDelete} disabled={isDeleting}>Delete</Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}