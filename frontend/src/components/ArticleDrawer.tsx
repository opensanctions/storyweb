import { Drawer, Tab, Tabs } from "@blueprintjs/core"
import { SyntheticEvent } from "react"
import { ARTICLE_ICON } from "../constants"
import { useFetchArticleQuery } from "../services/articles"
import { useFetchClusterListingQuery } from "../services/clusters"
import ArticleText from "./ArticleText"
import { ErrorSection, NumericTag, SectionLoading } from "./util"

import styles from '../styles/Article.module.scss'
import ArticleClusters from "./ArticleClusters"

type ArticleDrawerProps = {
  articleId: string,
  tags?: string[][]
  isOpen: boolean,
  onClose: (event: SyntheticEvent<HTMLElement>) => void
}

export default function ArticleDrawer({ articleId, tags, isOpen, onClose }: ArticleDrawerProps) {
  const { data: article, error: articleError } = useFetchArticleQuery(articleId as string);
  const clustersQuery = { article: articleId, limit: 0 };
  const { data: clusters } = useFetchClusterListingQuery(clustersQuery);
  const realTags = tags ? tags : []
  const realIsOpen = isOpen && articleId.trim().length > 1;

  return (
    <Drawer
      size={"40%"}
      isOpen={realIsOpen}
      onClose={onClose}
      icon={ARTICLE_ICON}
      hasBackdrop={false}
      autoFocus
      enforceFocus
      title={article ? article.title : 'No article'}
    >
      <div className={styles.articleDrawer}>
        {(article === undefined) && (
          <SectionLoading />
        )}
        {(articleError !== undefined) && (
          <ErrorSection title="Could not load the article" />
        )}
        {article && (
          <Tabs id="articleView" defaultSelectedTabId="text">
            <Tab
              id="text"
              title="Text"
              panel={
                <ArticleText text={article.text} tags={realTags} />
              }
            />
            <Tab
              title={
                <>
                  Extracted entities
                  <NumericTag value={clusters?.total} className="tab-tag" />
                </>
              }
              panel={
                <ArticleClusters article={article} />
              }
            />
          </Tabs>
        )}

      </div>
    </Drawer>
  )
}