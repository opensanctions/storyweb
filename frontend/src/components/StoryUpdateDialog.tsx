import { Button, Classes, Dialog, FormGroup, InputGroup, TextArea } from "@blueprintjs/core";
import { FormEvent, MouseEvent, useState } from "react";
import { STORY_ICON } from "../constants";
import { useUpdateStoryMutation } from "../services/stories";
import { IStory } from "../types";

type StoryUpdateDialogProps = {
  story: IStory
  isOpen: boolean
  onClose: () => void
}

export default function StoryUpdateDialog({ story, isOpen, onClose }: StoryUpdateDialogProps) {
  const [title, setTitle] = useState(story.title);
  const [summary, setSummary] = useState(story.summary);
  const [updateStory, { isLoading: isCreating }] = useUpdateStoryMutation();

  const hasTitle = title.trim().length > 3;

  const onSave = async (e: MouseEvent | FormEvent) => {
    e.preventDefault();
    if (hasTitle && !isCreating) {
      await updateStory({ id: story.id, title: title, summary: summary }).unwrap();
      onClose()
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} icon={STORY_ICON} title="Edit story">
      <form onSubmit={onSave}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup
            helperText="Describe your story with a simple sentence."
            label="Title"
            labelFor="text-input"
          >
            <InputGroup id="text-input" large placeholder="Story title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormGroup>
          <FormGroup
            label="Summary"
            labelFor="text-input"
          >
            <TextArea id="text-input" fill large placeholder="Short description" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={onSave} disabled={!isCreating && !hasTitle}>Save</Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}