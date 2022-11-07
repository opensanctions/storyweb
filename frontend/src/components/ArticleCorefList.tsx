import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Menu, MenuItem } from '@blueprintjs/core';


import { useFetchArticleListingQuery } from "../services/articles"
import { IArticle } from "../types";

type ArticleCorefListProps = {
  clusters: string[]
}

export default function ArticleCorefList({ clusters }: ArticleCorefListProps) {
  const articleParams = { 'cluster': clusters };
  const [params, setParams] = useSearchParams();
  const paramsObj = Object.fromEntries(params.entries());
  const articleId = params.get('article');
  const { data, isLoading } = useFetchArticleListingQuery(articleParams);
  useEffect(() => {
    if (data !== undefined && articleId === null && data.results.length > 0) {
      setParams({ ...paramsObj, article: data.results[0].id });
    }
  }, [articleId, data, paramsObj, setParams])
  if (isLoading || data === undefined) {
    return null;
  }



  const onSelect = (e: React.MouseEvent<HTMLElement>, article: IArticle) => {
    e.preventDefault();
    setParams({ ...paramsObj, article: article.id });
  }

  return (
    <Menu>
      {data.results.map((a) => (
        <MenuItem key={a.id} onClick={(e) => onSelect(e, a)} text={a.title} active={a.id === articleId} />
      ))
      }
    </Menu >
  )
};