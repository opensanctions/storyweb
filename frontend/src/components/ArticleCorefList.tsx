import { useState } from "react";
import { Menu, MenuItem } from '@blueprintjs/core';

import { useFetchArticleListingQuery } from "../services/articles"
import ArticleDrawer from "./ArticleDrawer";
import { IArticle } from "../types";

type ArticleCorefListProps = {
  clusters: string[]
  tags: string[][]
}

export default function ArticleCorefList({ clusters, tags }: ArticleCorefListProps) {
  const [articleId, setArticleId] = useState<string | undefined>()
  const articleParams = { cluster: clusters };
  const { data, isLoading } = useFetchArticleListingQuery(articleParams);
  if (isLoading || data === undefined) {
    return null;
  }

  const onClick = (e: React.MouseEvent<HTMLElement>, article: IArticle) => {
    e.preventDefault();
    setArticleId(article.id);
  }

  return (
    <>
      <Menu>
        {data.results.map((a) => (
          <MenuItem
            key={a.id}
            onClick={(e) => onClick(e, a)}
            text={a.title} active={a.id === articleId} />
        ))
        }
      </Menu>
      <ArticleDrawer
        onClose={(e) => setArticleId(undefined)}
        articleId={articleId}
        tags={tags}
      />
    </>
  )
};