import { ControlGroup, Classes, HTMLTable, Button, Checkbox, IconSize, Icon } from '@blueprintjs/core';
import classnames from "classnames";
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import Pagination from '../components/Pagination';
import { ErrorSection, Numeric, SectionLoading, ClusterTypeIcon } from '../components/util';
import { CLUSTER_ICON } from '../constants';
import { useNodeTypes } from '../selectors';

import { useFetchClusterListingQuery, useMergeClustersMutation } from '../services/clusters';
import { asString, getClusterLink, listToggle, useListingPagination } from "../util";

export default function ClusterIndex() {
  const [params, setParams] = useSearchParams();
  const page = useListingPagination('clusters');
  const [query, setQuery] = useState(asString(params.get('q')) || '');
  const [merges, setMerges] = useState([] as string[]);
  const [postMerge, { isLoading: isUpdating }] = useMergeClustersMutation();
  const { data: listing, error } = useFetchClusterListingQuery({
    ...page,
    q: params.get('q'),
    types: useNodeTypes(),
  });

  const onMerge = async () => {
    if (merges.length > 1) {
      const [anchor, ...other] = merges;
      await postMerge({ anchor: anchor, other: other }).unwrap()
      setMerges([]);
    }
  }

  const toggleMerge = async (id: string) => {
    setMerges(listToggle(merges, id));
  }

  const onSubmit = function (e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParams({ q: query });
  }

  if (error !== undefined) {
    return <ErrorSection title="Cannot get cluster listing" />
  }

  return (
    <div>
      {listing === undefined && (
        <h1>
          <Icon size={IconSize.LARGE} icon={CLUSTER_ICON} />{' '}
          Entities in the StoryWeb database
        </h1>
      )}
      {listing !== undefined && (
        <h1>
          <Icon size={IconSize.LARGE} icon={CLUSTER_ICON} />{' '}
          <Numeric value={listing.total} /> entities in the StoryWeb database
        </h1>
      )}

      <section className="section">
        <form onSubmit={onSubmit}>
          <ControlGroup fill>
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entities..."
            />
            <Button icon="search" type="submit">Search</Button>
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
                <th>Label</th>
                <th className="numeric">Articles</th>
                <th style={{ width: "1%" }} className="numeric">
                  <Button small onClick={onMerge} disabled={merges.length < 2}>
                    Merge
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {listing.results.map((cluster) => (
                <tr key={cluster.id}>
                  <td>
                    <ClusterTypeIcon type={cluster.type} size={14} />
                    <Link to={getClusterLink(cluster)}>{cluster.label}</Link>
                  </td>
                  <td className="numeric">
                    <Numeric value={cluster.articles} />
                  </td>
                  <td style={{ width: "1%" }} className="numeric">
                    <Checkbox
                      checked={merges.indexOf(cluster.id) !== -1}
                      onClick={() => toggleMerge(cluster.id)}
                      disabled={isUpdating}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
          <Pagination prefix='clusters' response={listing} />
        </>
      )}
    </div>
  )
}
