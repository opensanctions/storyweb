import { Drawer, DrawerSize } from "@blueprintjs/core"
import { SyntheticEvent } from "react"
import { IArticle } from "../lib/types"

type ArticleDrawerProps = {
  article: IArticle,
  isOpen: boolean,
  onClose: (event: SyntheticEvent<HTMLElement>) => void
}

export function ArticleDrawer({ article, isOpen, onClose }: ArticleDrawerProps) {
  return (
    <Drawer
      size={DrawerSize.STANDARD}
      isOpen={isOpen}
      onClose={onClose}
      hasBackdrop
      autoFocus
      enforceFocus
      title={article.title}
    >
      <iframe src={article.url} referrerPolicy="no-referrer" />
    </Drawer>
  )
}