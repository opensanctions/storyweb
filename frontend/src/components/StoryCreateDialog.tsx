import { Button, Classes, Dialog, FormGroup, InputGroup } from "@blueprintjs/core";
import { FormEvent, MouseEvent, useState } from "react";
import { useCreateStoryMutation } from "../services/stories";

type StoryCreateDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export default function StoryCreateDialog({ isOpen, onClose }: StoryCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [createStory, { isLoading: isCreating }] = useCreateStoryMutation();

  const hasTitle = title.trim().length > 2;

  const onCreate = async (e: MouseEvent | FormEvent) => {
    e.preventDefault();
    if (hasTitle && !isCreating) {
      await createStory({ title: title }).unwrap();
      setTitle('')
      onClose()
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create a new story">
      <form onSubmit={onCreate}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup
            helperText="Describe your story with a simple sentence."
            label="Title"
            labelFor="text-input"
          >
            <InputGroup id="text-input" placeholder="Story title" value={title} onChange={(e) => setTitle(e.target.value)} />
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