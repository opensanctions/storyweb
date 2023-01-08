import { Drawer, DrawerSize } from "@blueprintjs/core"
import { SyntheticEvent } from "react"
import { ARTICLE_ICON } from "../constants"
import { useFetchArticleQuery } from "../services/articles"
import { useFetchClusterListingQuery } from "../services/clusters"
import { IArticle } from "../types"
import ArticleText from "./ArticleText"
import { ErrorSection, SectionLoading } from "./util"

type ArticleDrawerProps = {
  articleId: string,
  tags?: string[][]
  isOpen: boolean,
  onClose: (event: SyntheticEvent<HTMLElement>) => void
}

export default function ArticleDrawer({ articleId, tags, isOpen, onClose }: ArticleDrawerProps) {
  const { data: article, error: articleError } = useFetchArticleQuery(articleId as string);
  const { data: clusters, error: clustersError } = useFetchClusterListingQuery({
    article: articleId,
    limit: 1000
  });
  if (articleError !== undefined || clustersError !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (article === undefined || clusters === undefined) {
    return <SectionLoading />
  }
  const anyTags = tags ? tags : []

  return (
    <Drawer
      size={DrawerSize.STANDARD}
      isOpen={isOpen}
      onClose={onClose}
      icon={ARTICLE_ICON}
      // hasBackdrop
      autoFocus
      enforceFocus
      title={article ? article.title : 'No article'}
    >
      {article && (
        <ArticleText text={article.text} tags={anyTags} />
      )}
    </Drawer>
  )
}