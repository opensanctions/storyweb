import { ILink } from '../types';
import { FormEvent, useEffect, useState } from 'react';
import { getClusterLink } from '..//util';
import { Button, Card, Elevation, HotkeyConfig, HotkeysTarget2, Label, Radio, RadioGroup } from '@blueprintjs/core';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SectionLoading, ClusterTypeIcon } from '../components/util';
import { useFetchOntologyQuery } from '../services/ontology';
import { useFetchPredictionQuery, useSaveLinkMutation } from '../services/links';
import ArticleCorefList from '../components/ArticleCorefList';
import StoryLinkerBanner from '../components/StoryLinkerBanner';
import { canHaveBidi, canHaveLink } from '../logic';

import styles from '../styles/Linker.module.scss';



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
  const { data: prediction, isLoading: isPredicting } = useFetchPredictionQuery({
    anchor: anchorId || '',
    other: otherId || ''
  })
  // const { data: anchor, isLoading: anchorLoading } = useFetchClusterQuery(anchorId || '');
  // const { data: other, isLoading: otherLoading } = useFetchClusterQuery(otherId || '');
  // const linkParams = { cluster: [anchorId, otherId], limit: 1 }
  // const { data: linksListing } = useFetchLinksQuery(linkParams);
  const [saveLink, { isLoading: isSaving }] = useSaveLinkMutation()

  useEffect(() => {
    if (prediction !== undefined) {
      setLink((l) => ({ ...l, source: prediction.source.id, target: prediction.target.id, type: prediction.type }))
    }
  }, [prediction]);

  if (prediction === undefined || isPredicting || ontology === undefined || isSaving) {
    return <SectionLoading />
  }

  const linkType = ontology.link_types.find((lt) => lt.name === link.type) || ontology.link_types[0]
  const source = link.source === prediction.source.id ? prediction.source : prediction.target;
  const target = link.target === prediction.target.id ? prediction.target : prediction.source;
  const linkOptions = ontology.link_types.filter((lt) => canHaveBidi(ontology, source, target, lt.name));
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
          <Card elevation={Elevation.TWO}>
            <>
              <Label>Please pick the <strong>type of the relationship</strong> between {source.label} and {target.label}:</Label>
              <Card elevation={Elevation.THREE} className={styles.phrase}>
                <strong>
                  <ClusterTypeIcon type={source.type} size={14} />
                  <Link to={getClusterLink(source)}>{source.label}</Link>
                </strong>
                {' '}
                <span className={styles.phraseSpan}>
                  {linkType.phrase}
                </span>
                {' '}
                <strong>
                  <ClusterTypeIcon type={target.type} size={14} />
                  <Link to={getClusterLink(target)}>{target.label}</Link>
                </strong>
              </Card>
              <div className="page-column-area">
                <div className="page-column">
                  <form onSubmit={onSubmit}>
                    <RadioGroup
                      label="Select link type:"
                      name="type"
                      onChange={onChangeType}
                      selectedValue={link.type}
                    >
                      {linkOptions.map((lt) => (
                        <Radio label={lt.label} value={lt.name} />
                      ))}
                    </RadioGroup>
                    <Button type="submit">Save</Button>
                    <Button onClick={onFlip} disabled={!canFlip}>Flip direction</Button>
                  </form>
                </div>
                <div className="page-column-wide">
                  <Label>Research the relationship using articles that mention both:</Label>
                  <ArticleCorefList
                    clusters={[source.id, target.id]}
                    tags={[prediction.source.labels, prediction.target.labels]}
                  />
                </div>
              </div>
            </>
          </Card>
        </>
      </HotkeysTarget2>
    </div>
  )
}
