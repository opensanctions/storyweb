import { HTMLTable } from "@blueprintjs/core"
import Link from "next/link"
import { ICluster, IListingResponse, ISimilarCluster } from "../lib/types"
import { getClusterLink } from "../lib/util"
import { SpacedList, TagLabel } from "./util"

type SimilarListingProps = {
  cluster: ICluster,
  response: IListingResponse<ISimilarCluster>
}

export default function SimilarListing({ cluster, response }: SimilarListingProps) {
  return (
    <>
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
                {'[ ]'}
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <code>{response.debug_msg}</code>
    </>
  )
}