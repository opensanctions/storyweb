import { Drawer, Tab, Tabs } from "@blueprintjs/core"
import { SyntheticEvent, useEffect, useState } from "react"
import { ARTICLE_ICON } from "../constants"
import { useFetchArticleQuery } from "../services/articles"
import { useFetchClusterListingQuery } from "../services/clusters"
import ArticleText from "./ArticleText"
import { ErrorSection, NumericTag, SectionLoading } from "./util"

import styles from '../styles/Article.module.scss'
import ArticleClusters from "./ArticleClusters"

type ArticleDrawerInnerProps = {
  articleId: string,
  tags?: string[][]
  isOpen: boolean,
  onClose: (event: SyntheticEvent<HTMLElement>) => void
  onClosed: (node: HTMLElement) => void
}

export function ArticleDrawerInner({ articleId, tags, isOpen, onClose, onClosed }: ArticleDrawerInnerProps) {
  const { data: article, error: articleError } = useFetchArticleQuery(articleId);
  const clustersQuery = { article: articleId, limit: 0 };
  const { data: clusters } = useFetchClusterListingQuery(clustersQuery);
  const realTags = tags ? tags : []
  const realIsOpen = isOpen && articleId.trim().length > 1;

  return (
    <Drawer
      size={"40%"}
      isOpen={realIsOpen}
      onClose={onClose}
      onClosed={onClosed}
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
              key="text"
              title="Text"
              panel={
                <ArticleText text={article.text} tags={realTags} />
              }
            />
            <Tab
              id="entities"
              key="entities"
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

type ArticleDrawerProps = {
  articleId?: string,
  tags?: string[][]
  onClose: (event: SyntheticEvent<HTMLElement>) => void
}

export default function ArticleDrawer({ articleId, tags, onClose }: ArticleDrawerProps) {
  const isOpen = !!articleId;
  const [activeArticleId, setActiveArticleId] = useState<string | undefined>(articleId);

  useEffect(() => {
    if (!!articleId && articleId != activeArticleId) {
      setActiveArticleId(articleId);
    }
  })

  const onClosed = () => {
    setActiveArticleId(undefined);
  }

  if (activeArticleId === undefined) {
    return null;
  }

  return (
    <ArticleDrawerInner
      articleId={activeArticleId}
      onClose={onClose}
      onClosed={onClosed}
      isOpen={isOpen}
      tags={tags}
    />
  );
}