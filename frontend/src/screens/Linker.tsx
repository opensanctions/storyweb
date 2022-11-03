
import { ILink, ILinkType, IListingResponse, ICluster, IOntology, IClusterDetails } from '../types';
import { FormEvent, useEffect, useState } from 'react';
import { getClusterLink, getLinkLoomLink } from '..//util';
import { Button, HotkeyConfig, HotkeysTarget2, RadioGroup, useHotkeys } from '@blueprintjs/core';
import { useFetchClusterQuery, useFetchRelatedClusterListingQuery } from '../services/clusters';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SectionLoading } from '../components/util';
import { useFetchOntologyQuery } from '../services/ontology';
import { useFetchLinksQuery, useSaveLinkMutation } from '../services/links';


export default function Linker() {
  const navigate = useNavigate();
  const { data: ontology } = useFetchOntologyQuery();
  const [params, setParams] = useSearchParams();
  const anchorId = params.get('anchor');
  const otherId = params.get('other');
  const relatedMode = params.get('related') !== null;
  if (anchorId === null) {
    navigate('/clusters');
  }
  if (otherId === null) {
    navigate(`/clusters/${otherId}`);
  }
  const [link, setLink] = useState({
    source: anchorId,
    source_cluster: anchorId,
    target: otherId,
    target_cluster: otherId,
    type: 'UNRELATED'
  } as ILink);
  const { data: anchor, isLoading: anchorLoading } = useFetchClusterQuery(anchorId || '');
  const { data: other, isLoading: otherLoading } = useFetchClusterQuery(otherId || '');
  const linkParams = { cluster: [anchorId, otherId], limit: 1 }
  const { data: linksListing } = useFetchLinksQuery(linkParams);
  const [saveLink, { isLoading: isSaving }] = useSaveLinkMutation()

  useEffect(() => {
    if (linksListing !== undefined && linksListing.results.length) {
      setLink({ ...link, type: linksListing.results[0].type })
    }
  }, [linksListing]);

  if (anchor === undefined || other === undefined || linksListing === undefined ||
    anchorLoading || otherLoading || ontology === undefined) {
    return <SectionLoading />
  }

  const linkType = ontology.link_types.find((lt) => lt.name === link.type) || ontology.link_types[0]
  const linkOptions = ontology.link_types.map(l => ({ value: l.name, label: l.label }));

  const save = async function () {
    console.log("SAVE")
    const saved = await saveLink(link).unwrap();
    console.log("SAVED", `/linker/related?anchor=${saved.source_cluster}`)
    if (relatedMode) {
      navigate(`/linker/related?anchor=${saved.source_cluster}&previous=${otherId}`);
    } else {
      navigate(`/clusters/${saved.source_cluster}`)
    }
  }

  const onSubmit = async function (event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save()
  }

  const onChangeType = (event: FormEvent<HTMLInputElement>) => {
    setLink({ ...link, type: event.currentTarget.value })
  }

  const loomHotkeys: HotkeyConfig[] = [
    {
      combo: "s",
      group: "Link editor",
      global: true,
      label: "Same",
      onKeyDown: async () => {
        setLink({ ...link, type: 'SAME' });
        await save()
      },
    },
    {
      combo: "u",
      group: "Link editor",
      global: true,
      label: "Unrelated",
      onKeyDown: async () => {
        setLink({ ...link, type: 'UNRELATED' });
        await save()
      },
    },
  ];

  return (
    <div>
      <HotkeysTarget2 hotkeys={loomHotkeys}>
        <>
          <h2>
            <code>
              <Link to={getClusterLink(anchor)}>{anchor.label}</Link>
            </code>
            {' '}
            {linkType.phrase}
            {' '}
            <code>
              <Link to={getClusterLink(other)}>{other.label}</Link>
            </code>
          </h2>
          <form onSubmit={onSubmit}>
            <RadioGroup
              label="Link type"
              name="type"
              onChange={onChangeType}
              selectedValue={link.type}
              options={linkOptions}
            >
            </RadioGroup>
            <Button type="submit">Save</Button>
          </form>
        </>
      </HotkeysTarget2>
    </div>
  )
}
