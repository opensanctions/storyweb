import { Button, Classes, Dialog, FormGroup, InputGroup, TextArea } from "@blueprintjs/core";
import { FormEvent, MouseEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STORY_ICON } from "../constants";
import { useCreateStoryMutation } from "../services/stories";

type StoryCreateDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export default function StoryCreateDialog({ isOpen, onClose }: StoryCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const navigate = useNavigate();
  const [createStory, { isLoading: isCreating }] = useCreateStoryMutation();

  const hasTitle = title.trim().length > 3;

  const onCreate = async (e: MouseEvent | FormEvent) => {
    e.preventDefault();
    if (hasTitle && !isCreating) {
      const story = await createStory({ title: title, summary: summary }).unwrap();
      navigate(`/stories/${story.id}`);
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} icon={STORY_ICON} title="Create a new story">
      <form onSubmit={onCreate}>
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
            <TextArea id="text-input" fill large
              rows={5}
              placeholder="Short description"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={onCreate} disabled={!isCreating && !hasTitle}>Create</Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}