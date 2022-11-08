import { Drawer, DrawerSize } from "@blueprintjs/core"
import { SyntheticEvent } from "react"
import { IArticle } from "../types"

type ArticleDrawerProps = {
  article?: IArticle,
  isOpen: boolean,
  onClose: (event: SyntheticEvent<HTMLElement>) => void
}

export default function ArticleDrawer({ article, isOpen, onClose }: ArticleDrawerProps) {
  return (
    <Drawer
      size={DrawerSize.STANDARD}
      isOpen={isOpen}
      onClose={onClose}
      hasBackdrop
      autoFocus
      enforceFocus
      title={article ? article.title : 'No article'}
    >
      {article && (
        <iframe src={article.url} referrerPolicy="no-referrer" />
      )}
    </Drawer>
  )
}