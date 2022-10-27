import type { GetServerSidePropsContext } from 'next'
import Link from 'next/link';
import classnames from 'classnames';
import { Button, Classes, ControlGroup, HTMLSelect, HTMLTable } from '@blueprintjs/core';

import Layout from '../../components/Layout'
import { IArticle, IListingResponse, ISite } from '../../lib/types';
import { fetchJson } from '../../lib/data';
// import { useState } from 'react';
// import { ArticleDrawer } from '../../components/Article';


interface ArticleIndexProps {
  response: IListingResponse<IArticle>,
  query: string,
  site: string,
  sites: string[]
}

export default function ArticleIndex({ response, query, site, sites }: ArticleIndexProps) {
  // const [previewArticle, setPreviewArticle] = useState<IArticle | undefined>(undefined);

  // const onArticleClick = (event: React.MouseEvent<HTMLAnchorElement>, article: IArticle) => {
  //   event.preventDefault();
  //   console.log(article);
  //   setPreviewArticle(article)
  // }

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
            <HTMLSelect
              className={classnames(Classes.HTML_SELECT)}
              defaultValue={site}
              name="site">
              <option value="">(all sites)</option>
              {sites.map((s) =>
                <option key={s} value={s}>{s}</option>
              )}
            </HTMLSelect>
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
                <Link href={`/articles/${article.id}`}>{article.title}</Link>
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
  const data = await fetchJson<IListingResponse<IArticle>>('/articles', params);
  const sitesData = await fetchJson<IListingResponse<ISite>>('/sites');
  const sites = sitesData.results.map((s) => s.site);

  return {
    props: { response: data, query, site, sites },
  }
}
