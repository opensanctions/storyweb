import { Button, ButtonGroup, Checkbox, HTMLTable, Intent } from "@blueprintjs/core"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useFetchSimilarClusterListingQuery, useMergeClustersMutation } from "../services/clusters"
import { ICluster } from "../types"
import { getClusterLink } from "../util"
import { SectionLoading, SpacedList, TagLabel } from "./util"

type SimilarListingProps = {
  cluster: ICluster,
}

export default function SimilarListing({ cluster }: SimilarListingProps) {
  const { data: listing } = useFetchSimilarClusterListingQuery({ cluster, params: {} })
  const [postMerge, { isLoading }] = useMergeClustersMutation()
  const [merges, setMerges] = useState([] as string[]);

  if (listing === undefined) {
    return <SectionLoading />
  }
  const allSelected = merges.length == listing.results.length;

  const onMerge = async () => {
    const response = await postMerge({ anchor: cluster.id, other: merges }).unwrap()
    // const resp = await fetch(`/api/merge`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(mergeRequest),
    // });
    setMerges([]);
    // const newCluster = await resp.json() as ICluster;
    // if (newCluster.id == cluster.id) {
    //   router.reload();
    // } else {
    //   router.push(`/clusters/${newCluster.id}#view=similar`);
    // }
  }

  const toggleAll = async () => {
    if (allSelected) {
      setMerges([]);
    } else {
      setMerges(listing.results.map(r => r.id));
    }
  }

  const toggleOne = async (id: string) => {
    if (merges.indexOf(id) === -1) {
      setMerges([...merges, id]);
    } else {
      setMerges(merges.filter(x => x !== id));
    }
  }

  return (
    <>
      <ButtonGroup>
        <Button
          disabled={merges.length == 0}
          onClick={() => onMerge()}
          intent={Intent.PRIMARY}
        >
          Merge ({merges.length})
        </Button>
        <Button
          onClick={() => toggleAll()}
        >
          {allSelected && <>Select none</>}
          {!allSelected && <>Select all</>}
        </Button>
      </ButtonGroup>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Common tags</th>
            <th>Count</th>
            <th>Same</th>
          </tr>
        </thead>
        <tbody>
          {listing.results.map((similar) => (
            <tr key={similar.id}>
              <td>
                <Link to={getClusterLink(similar)}>{similar.label}</Link>
              </td>
              <td><code>{similar.category}</code></td>
              <td>
                <SpacedList values={similar.common.map((l) => <TagLabel key={l} label={l} />)} />
              </td>
              <td>
                {similar.common_count}
              </td>
              <td>
                <Checkbox
                  checked={merges.indexOf(similar.id) !== -1}
                  onClick={() => toggleOne(similar.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <code>{listing.debug_msg}</code>
    </>
  )
}