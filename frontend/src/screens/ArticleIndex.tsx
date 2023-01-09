import { ControlGroup, Classes, HTMLSelect, HTMLTable, Button, IconSize, Icon } from '@blueprintjs/core';
import classnames from "classnames";
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import ArticleStoryEditor from '../components/ArticleStoryEditor';
import Pagination from '../components/Pagination';
import { Numeric, SectionLoading } from '../components/util';
import { ARTICLE_ICON } from '../constants';

import { useFetchArticleListingQuery } from "../services/articles"
import { useFetchSitesQuery } from '../services/sites';
import { asString, useListingPagination } from "../util";

export default function ArticleIndex() {
  const [params, setParams] = useSearchParams();
  const page = useListingPagination('articles');
  const { data: sitesResponse } = useFetchSitesQuery();
  const [query, setQuery] = useState(asString(params.get('q')) || '')
  const [site, setSite] = useState(asString(params.get('site')) || '')
  const { data: listing } = useFetchArticleListingQuery({
    ...page,
    q: params.get('q'),
    site: params.get('site'),
    sort: 'tags:desc'
  });
  const sites = sitesResponse === undefined ? [] : sitesResponse.results.map(s => s.site);

  const onSubmit = function (e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParams({ site: site, q: query });
  }

  return (
    <div>
      {(listing === undefined || sites === undefined) && (
        <h1>
          <Icon size={IconSize.LARGE} icon={ARTICLE_ICON} />{' '}
          Articles in the StoryWeb database
        </h1>
      )}
      {(listing !== undefined && sites !== undefined) && (
        <h1>
          <Icon size={IconSize.LARGE} icon={ARTICLE_ICON} />{' '}
          <Numeric value={listing.total} /> articles from <Numeric value={sites.length} /> sources in the StoryWeb database
        </h1>
      )}

      <section className="section">
        <form onSubmit={onSubmit}>
          <ControlGroup fill>
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in articles..."
            />
            <HTMLSelect
              className={classnames(Classes.HTML_SELECT)}
              value={site}
              onChange={(e) => setSite(e.target.value)}
            >
              <option value="">(all sites)</option>
              {sites.map((s) =>
                <option key={s} value={s}>{s}</option>
              )}
            </HTMLSelect>
            <Button type="submit">Search</Button>
          </ControlGroup>
        </form>
      </section>
      {listing === undefined && (
        <SectionLoading />
      )}
      {listing !== undefined && (
        <>
          <HTMLTable condensed bordered className="wide">
            <thead>
              <tr>
                <th>Title</th>
                <th>Site</th>
                <th className="numeric">Entities</th>
                <th className="numeric">Stories</th>
              </tr>
            </thead>
            <tbody>
              {listing.results.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link to={article.id}>{article.title}</Link>
                  </td>
                  <td>
                    {article.site}
                  </td>
                  <td className="numeric">
                    <Numeric value={article.tags} />
                  </td>
                  <td style={{ width: "1%" }} className="numeric">
                    <ArticleStoryEditor article={article} inList />
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
          <Pagination prefix='articles' response={listing} />
        </>
      )}
    </div >
  )
}
