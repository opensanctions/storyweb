import { ControlGroup, Classes, Intent, Button, NonIdealState, Card, Elevation, ButtonGroup, Menu, MenuItem } from '@blueprintjs/core';
import classnames from "classnames";
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import StoryCreateDialog from '../components/StoryCreateDialog';
import { SectionLoading } from '../components/util';

import { useFetchStoryListingQuery } from '../services/stories';
import ScreenHeading from '../components/ScreenHeading';
import { asString } from "../util";

import styles from '../styles/Story.module.scss';
import { API_URL } from '../constants';
import { Popover2, PopupKind } from '@blueprintjs/popover2';

export default function StoryIndex() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
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
      <ScreenHeading title={<>Your StoryWebs</>}>
        <ButtonGroup>
          <Button intent={Intent.PRIMARY} onClick={onCreate} icon="add">New story...</Button>
          <Popover2
            placement="bottom-start"
            popupKind={PopupKind.MENU}
            minimal
            content={
              <Menu>
                <MenuItem icon="download" text="Aleph" label="(FollowTheMoney)" href={`${API_URL}/ftm`} target="_blank" download />
                <MenuItem icon="download" text="Gephi" label="(GEXF)" href={`${API_URL}/gexf`} target="_blank" download />
              </Menu>
            }
          >
            <Button intent={Intent.NONE} icon="download">
              Export
            </Button>
          </Popover2>
        </ButtonGroup>
      </ScreenHeading>
      <StoryCreateDialog isOpen={showCreate} onClose={onCloseCreate} />
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
      {
        listing === undefined && (
          <SectionLoading />
        )
      }
      {
        (listing !== undefined && listing.results.length === 0) && (
          <NonIdealState
            icon="heart-broken"
            title="You're not telling a story yet."
            description="Group articles into stories to begin building story graphs."
          />
        )
      }
      {
        (listing !== undefined && listing.results.length > 0) && (
          <div className={styles.storyCardArea}>
            {listing.results.map((story) => (
              <Card
                key={story.id}
                interactive={true}
                elevation={Elevation.TWO}
                className={styles.storyCard}
                onClick={() => navigate(`/stories/${story.id}`)}
              >
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
              </Card>
            ))}
          </div>
        )
      }
    </div >
  )
}
