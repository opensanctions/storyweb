import { Button, ButtonGroup, Checkbox, HTMLTable, Intent } from "@blueprintjs/core"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { ICluster, IListingResponse, ISimilarCluster } from "../lib/types"
import { getClusterLink } from "../lib/util"
import { SpacedList, TagLabel } from "./util"

type SimilarListingProps = {
  cluster: ICluster,
  response: IListingResponse<ISimilarCluster>
}

export default function SimilarListing({ cluster, response }: SimilarListingProps) {
  const router = useRouter();
  const [merges, setMerges] = useState([] as string[]);
  const allSelected = merges.length == response.results.length;

  const onMerge = async () => {
    const mergeRequest = { anchor: cluster.id, other: merges };
    const resp = await fetch(`/api/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mergeRequest),
    });
    setMerges([]);
    const newCluster = await resp.json() as ICluster;
    if (newCluster.id == cluster.id) {
      router.reload();
    } else {
      router.push(`/clusters/${newCluster.id}#view=similar`);
    }
  }

  const toggleAll = async () => {
    if (allSelected) {
      setMerges([]);
    } else {
      setMerges(response.results.map(r => r.id));
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
          {response.results.map((similar) => (
            <tr key={similar.id}>
              <td>
                <Link href={getClusterLink(similar)}>{similar.label}</Link>
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
      <code>{response.debug_msg}</code>
    </>
  )
}