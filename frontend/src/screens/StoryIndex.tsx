import { ControlGroup, Classes, Intent, HTMLTable, Button, NonIdealState } from '@blueprintjs/core';
import classnames from "classnames";
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { Numeric, SectionLoading } from '../components/util';

import { useFetchSitesQuery } from '../services/sites';
import { useFetchStoryListingQuery } from '../services/stories';
import { asString } from "../util";

export default function StoryIndex() {
  const [params, setParams] = useSearchParams();
  const { data: sitesResponse } = useFetchSitesQuery();
  const [query, setQuery] = useState(asString(params.get('q')) || '')
  const [site, setSite] = useState(asString(params.get('site')) || '')
  const { data: listing } = useFetchStoryListingQuery({
    q: params.get('q'),
  });

  const onSubmit = function (e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParams({ q: query });
  }

  return (
    <div>
      {(listing === undefined) && (
        <h1>Your StoryWebs</h1>
      )}
      <section className="section">
        <form onSubmit={onSubmit}>
          <ControlGroup fill>
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in storywebs..."
            />
            <Button type="submit">Search</Button>
          </ControlGroup>
        </form>
      </section>
      <section className="section">
        <Button intent={Intent.PRIMARY}>New story...</Button>
      </section>
      {listing === undefined && (
        <SectionLoading />
      )}
      {(listing !== undefined && listing.results.length === 0) && (
        <NonIdealState
          icon="heart-broken"
          title="You're not telling a story yet."
          description="Group articles into stories to begin building story graphs."
        />
      )}
      {(listing !== undefined && listing.results.length > 0) && (
        <HTMLTable condensed bordered className="wide">
          <thead>
            <tr>
              <th>Title</th>
            </tr>
          </thead>
          <tbody>
            {listing.results.map((story) => (
              <tr key={story.id}>
                <td>
                  <Link to={`/stories/${story.id}`}>{story.title}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      )}
    </div>
  )
}
