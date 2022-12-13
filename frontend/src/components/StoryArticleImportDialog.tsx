import { Button, Classes, Dialog, FormGroup, InputGroup } from "@blueprintjs/core";
import { FormEvent, MouseEvent, useState } from "react";
import { useImportStoryArticleMutation } from "../services/stories";
import { SectionLoading } from "./util";

type StoryArticleImportProps = {
    storyId: number
    isOpen: boolean
    onClose: () => void
}

export default function StoryArticleImportDialog({ storyId, isOpen, onClose }: StoryArticleImportProps) {
    const [url, setUrl] = useState('');
    const [importArticle, { isLoading: isCreating }] = useImportStoryArticleMutation();
    const hasUrl = url.trim().length > 10;

    const onImport = async (e: MouseEvent | FormEvent) => {
        e.preventDefault();
        if (hasUrl && !isCreating) {
            await importArticle({ story: storyId, url }).unwrap();
            setUrl('')
            onClose()
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Import an article">
            {isCreating && (
                <SectionLoading />
            )}
            {!isCreating && (
                <form onSubmit={onImport}>
                    <div className={Classes.DIALOG_BODY}>
                        <FormGroup
                            helperText="Give the link to the article, without paywall restrictions."
                            label="URL"
                            labelFor="text-input"
                        >
                            <InputGroup id="text-input" placeholder="https://www.news..." value={url} onChange={(e) => setUrl(e.target.value)} />
                        </FormGroup>
                    </div>
                    <div className={Classes.DIALOG_FOOTER}>
                        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                            <Button onClick={onImport} disabled={!isCreating && !hasUrl}>Import</Button>
                        </div>
                    </div>
                </form>
            )}
        </Dialog>
    )
}