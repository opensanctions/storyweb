import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Menu, MenuItem } from '@blueprintjs/core';


import { useFetchArticleListingQuery } from "../services/articles"
import { IArticle } from "../types";
import ArticleDrawer from "./ArticleDrawer";

type ArticleCorefListProps = {
  clusters: string[]
  tags: string[][]
}

export default function ArticleCorefList({ clusters, tags }: ArticleCorefListProps) {
  const [articleId, setArticleId] = useState(null as string | null)
  const articleParams = { cluster: clusters };
  const { data, isLoading } = useFetchArticleListingQuery(articleParams);
  if (isLoading || data === undefined) {
    return null;
  }

  // const onSelect = (e: React.MouseEvent<HTMLElement>, article: IArticle) => {
  //   e.preventDefault();
  //   setArticleId(article.id);
  // }

  return (
    <>
      <Menu>
        {data.results.map((a) => (
          <MenuItem
            key={a.id}
            onClick={(e) => setArticleId(a.id)}
            text={a.title} active={a.id === articleId} />
        ))
        }
      </Menu>
      <ArticleDrawer
        isOpen={articleId !== null}
        onClose={(e) => setArticleId(null)}
        articleId={articleId || ''}
        tags={tags}
      />
    </>
  )
};