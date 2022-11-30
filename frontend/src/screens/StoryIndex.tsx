import { ControlGroup, Classes, Intent, HTMLTable, Button, NonIdealState } from '@blueprintjs/core';
import classnames from "classnames";
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import StoryCreateDialog from '../components/StoryCreateDialog';
import { SectionLoading } from '../components/util';

import { useFetchStoryListingQuery } from '../services/stories';
import { asString } from "../util";

export default function StoryIndex() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(asString(params.get('q')) || '')
  const [showCreate, setShowCreate] = useState(false)
  const { data: listing } = useFetchStoryListingQuery({
    q: params.get('q'),
  });

  const onSubmit = function (e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParams({ q: query });
  }

  const onCreate = () => { setShowCreate(true) };
  const onCloseCreate = () => { setShowCreate(false) };

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
        <Button intent={Intent.PRIMARY} onClick={onCreate}>New story...</Button>
        <StoryCreateDialog isOpen={showCreate} onClose={onCloseCreate} />
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
