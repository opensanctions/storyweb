import { ControlGroup, Classes, HTMLTable, Button } from '@blueprintjs/core';
import classnames from "classnames";
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { ErrorSection, SectionLoading } from '../components/util';

import { useFetchClusterListingQuery } from '../services/clusters';
import { asString, getClusterLink } from "../util";

export default function ClusterIndex() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(asString(params.get('q')) || '')
  const { data: listing, error } = useFetchClusterListingQuery({
    q: params.get('q')
  });

  const onSubmit = function (e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParams({ q: query });
  }

  if (error !== undefined) {
    return <ErrorSection title="Cannot get cluster listing" />
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
              placeholder="Search entities..."
            />
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
              <th>Label</th>
              <th>Category</th>
              <th>Articles</th>
            </tr>
          </thead>
          <tbody>
            {listing.results.map((cluster) => (
              <tr key={cluster.id}>
                <td>
                  <Link to={getClusterLink(cluster)}>{cluster.label}</Link>
                </td>
                <td><code>{cluster.category}</code></td>
                <td>
                  {cluster.articles}
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      )}
    </div>
  )
}
