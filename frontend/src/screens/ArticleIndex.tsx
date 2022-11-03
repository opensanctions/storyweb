import { ControlGroup, Classes, HTMLSelect, HTMLTable, Button } from '@blueprintjs/core';
import classnames from "classnames";
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { SectionLoading } from '../components/util';


import { useFetchArticleListingQuery } from "../services/articles"
import { useFetchSitesQuery } from '../services/sites';
import { asString } from "../util";

export default function ArticleIndex() {
  const [params, setParams] = useSearchParams();
  const { data: sitesResponse } = useFetchSitesQuery();
  const [query, setQuery] = useState(asString(params.get('q')) || '')
  const [site, setSite] = useState(asString(params.get('site')) || '')
  const { data: listing } = useFetchArticleListingQuery({
    q: params.get('q'),
    site: params.get('site'),
    sort: 'tags_count:desc'
  });
  const sites = sitesResponse === undefined ? [] : sitesResponse.results.map(s => s.site);

  const onSubmit = function (e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParams({ site: site, q: query });
  }

  return (
    <div>
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
        <HTMLTable condensed bordered className="wide">
          <thead>
            <tr>
              <th>Title</th>
              <th>Site</th>
              <th className="numeric">Entities</th>
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
                  {article.tags_count}
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      )}
    </div>
  )
}
