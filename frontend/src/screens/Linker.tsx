import { ILink } from '../types';
import { FormEvent, useEffect, useState } from 'react';
import { getClusterLink } from '..//util';
import { Button, HotkeyConfig, HotkeysTarget2, Label, RadioGroup } from '@blueprintjs/core';
import { useFetchClusterQuery } from '../services/clusters';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SectionLoading, ClusterTypeIcon } from '../components/util';
import { useFetchOntologyQuery } from '../services/ontology';
import { useFetchLinksQuery, useSaveLinkMutation } from '../services/links';
import ArticleCorefList from '../components/ArticleCorefList';
import StoryLinkerBanner from '../components/StoryLinkerBanner';

import styles from '../styles/Linker.module.scss';
import { canHaveBidi, canHaveLink } from '../logic';


export default function Linker() {
  const navigate = useNavigate();
  const { data: ontology } = useFetchOntologyQuery();
  const [params] = useSearchParams();
  const anchorId = params.get('anchor');
  const otherId = params.get('other');
  const storyId = params.get('story');
  const relatedMode = params.get('related') !== null;
  if (anchorId === null) {
    navigate('/clusters');
  }
  if (otherId === null) {
    navigate(`/clusters/${anchorId}`);
  }
  const [link, setLink] = useState({
    source: anchorId,
    target: otherId,
    type: 'UNRELATED'
  } as ILink);
  const { data: anchor, isLoading: anchorLoading } = useFetchClusterQuery(anchorId || '');
  const { data: other, isLoading: otherLoading } = useFetchClusterQuery(otherId || '');
  const linkParams = { cluster: [anchorId, otherId], limit: 1 }
  const { data: linksListing } = useFetchLinksQuery(linkParams);
  const [saveLink, { isLoading: isSaving }] = useSaveLinkMutation()

  useEffect(() => {
    if (linksListing !== undefined && linksListing.results.length) {
      const existingLink = linksListing.results[0];
      setLink((l) => ({ ...l, source: existingLink.source_cluster, target: existingLink.target_cluster, type: existingLink.type }))
    }
  }, [linksListing]);

  if (anchor === undefined || other === undefined || linksListing === undefined ||
    anchorLoading || otherLoading || ontology === undefined || isSaving) {
    return <SectionLoading />
  }

  const linkType = ontology.link_types.find((lt) => lt.name === link.type) || ontology.link_types[0]
  const linkOptions = ontology.link_types
    .filter((lt) => canHaveBidi(ontology, anchor, other, lt.name))
    .map(l => ({ value: l.name, label: l.label }));
  const source = link.source === anchorId ? anchor : other;
  const target = link.target === anchorId ? anchor : other;
  const canFlip = canHaveLink(ontology, target, source, link.type);

  const save = async function () {
    const saved = await saveLink(link).unwrap();
    const newAnchor = link.source === anchorId ? saved.source_cluster : saved.target_cluster;
    if (storyId) {
      navigate(`/stories/${storyId}/linker?previous=${otherId}:${anchorId}`);
    } else if (relatedMode) {
      navigate(`/linker/related?anchor=${newAnchor}&previous=${otherId}`);
    } else {
      navigate(`/clusters/${newAnchor}`)
    }
  }

  const changeType = (type: string) => {
    if (!canHaveLink(ontology, source, target, type)) {
      setLink({ ...link, source: target.id, target: source.id, type: type })
    } else {
      setLink({ ...link, type: type })
    }


  }

  const onSubmit = async function (event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save()
  }

  const onFlip = function () {
    if (canFlip) {
      setLink({ ...link, source: link.target, target: link.source })
    }
  }

  const onChangeType = (event: FormEvent<HTMLInputElement>) => {
    changeType(event.currentTarget.value);
  }

  const loomHotkeys: HotkeyConfig[] = [
    {
      combo: "s",
      group: "Link editor",
      global: true,
      label: "Same",
      onKeyDown: async () => {
        changeType('SAME');
        await save()
      },
    },
    {
      combo: "u",
      group: "Link editor",
      global: true,
      label: "Unrelated",
      onKeyDown: async () => {
        changeType('UNRELATED');
        await save()
      },
    },
    {
      combo: "f",
      group: "Link editor",
      global: true,
      label: "Flip direction",
      onKeyDown: onFlip,
    },
  ];

  return (
    <div>
      <HotkeysTarget2 hotkeys={loomHotkeys}>
        <>
          {!!storyId && (
            <StoryLinkerBanner storyId={storyId} />
          )}
          <h3 className={styles.phrase}>
            <strong>
              <ClusterTypeIcon type={source.type} size={14} />
              <Link to={getClusterLink(source)}>{source.label}</Link>
            </strong>
            {' '}
            {linkType.phrase}
            {' '}
            <strong>
              <ClusterTypeIcon type={target.type} size={14} />
              <Link to={getClusterLink(target)}>{target.label}</Link>
            </strong>
          </h3>
          <div className="page-column-area">
            <div className="page-column">
              <form onSubmit={onSubmit}>
                <RadioGroup
                  label="Select link type:"
                  name="type"
                  onChange={onChangeType}
                  selectedValue={link.type}
                  options={linkOptions}
                >
                </RadioGroup>
                <Button type="submit">Save</Button>
                <Button onClick={onFlip} disabled={!canFlip}>Flip direction</Button>
              </form>
            </div>
            <div className="page-column">
              <Label>View articles that mention both:</Label>
              <ArticleCorefList
                clusters={[source.id, target.id]}
                tags={[anchor.labels, other.labels]}
              />
            </div>
          </div>
        </>
      </HotkeysTarget2>
    </div>
  )
}
