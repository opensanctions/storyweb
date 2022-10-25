import type { GetServerSidePropsContext } from 'next'
import classnames from 'classnames';
import { Button, Classes, ControlGroup, HTMLTable } from '@blueprintjs/core';
import Link from 'next/link';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Layout from '../../components/Layout'
import { IArticle, IArticleListingResponse, IArticleTagListingResponse, ISiteListingResponse } from '../../lib/types';
import { getTagLink } from '../../lib/util';
import { fetchJson } from '../../lib/data';
import { useState } from 'react';
import { ArticleDrawer } from '../../components/Article';

interface TagsProps {
  response: IArticleListingResponse,
  query: string,
  site: string,
  sites: string[]
}

export default function ArticleIndex({ response, query, site, sites }: TagsProps) {
  const [previewArticle, setPreviewArticle] = useState<IArticle | undefined>(undefined);

  const onArticleClick = (event: React.MouseEvent<HTMLAnchorElement>, article: IArticle) => {
    event.preventDefault();
    console.log(article);
    setPreviewArticle(article)
  }

  return (
    <Layout title="Articles">
      <section className="section">
        <form method="GET">
          <ControlGroup fill>
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              defaultValue={query}
              placeholder="Search in articles..."
              name="q"
            />
            <select
              className={classnames(Classes.HTML_SELECT)}
              defaultValue={site}
              name="site">
              <option value="">(all sites)</option>
              {sites.map((s) =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
            <Button type="submit">Search</Button>
          </ControlGroup>
        </form>
      </section>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Title</th>
            <th>Site</th>
            <th className="numeric">Entities</th>
          </tr>
        </thead>
        <tbody>
          {response.results.map((article) => (
            <tr key={article.id}>
              <td>
                <a onClick={(e) => onArticleClick(e, article)} href={article.url}>{article.title}</a>
              </td>
              <td>
                {article.site}
              </td>
              <td className="numeric">
                {article.tags_count}
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <ArticleDrawer
        isOpen={previewArticle !== undefined}
        article={previewArticle}
        onClose={() => setPreviewArticle(undefined)}
      />
    </Layout >
  )
}


export async function getServerSideProps(context: GetServerSidePropsContext) {
  const query = '' + (context.query.q || '');
  const site = '' + (context.query.site || '');
  const params = {
    ...context.query,
    sort: 'tags_count:desc'
  }
  const data = await fetchJson<IArticleListingResponse>('/articles', params);
  const sitesData = await fetchJson<ISiteListingResponse>('/sites');
  const sites = sitesData.results.map((s) => s.site);

  return {
    props: { response: data, query, site, sites },
  }
}
