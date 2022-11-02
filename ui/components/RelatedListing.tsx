import { AnchorButton, ButtonGroup, Classes, ControlGroup, HTMLTable } from "@blueprintjs/core";
import Link from "next/link";
import { ICluster, IListingResponse, IRelatedCluster } from "../lib/types";
import { getClusterLink, getLinkLoomLink } from "../lib/util";

type RelatedListingProps = {
  cluster: ICluster,
  response: IListingResponse<IRelatedCluster>
}

export default function RelatedListing({ cluster, response }: RelatedListingProps) {
  // const onSubmit = (e) => {
  // }

  return (
    <>
      {/* <form onSubmit={ }>
        <ControlGroup fill>
          <input
            className={classnames(Classes.INPUT, Classes.FILL)}
            defaultValue={query}
            placeholder="Search for entities..."
            name="q"
          />
          <Button type="submit">Search</Button>
        </ControlGroup>
      </form> */}
      <ButtonGroup>
        <AnchorButton href={getLinkLoomLink(cluster)}>Link tool</AnchorButton>
      </ButtonGroup>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Link</th>
            <th>Articles</th>
          </tr>
        </thead>
        <tbody>
          {response.results.map((related) => (
            <tr key={related.id}>
              <td>
                <Link href={getClusterLink(related)}>{related.label}</Link>
              </td>
              <td><code>{related.category}</code></td>
              <td>
                {related.link_types.length > 0 && (
                  <Link href={getLinkLoomLink(cluster, related)}><>{related.link_types}</></Link>
                )}
                {related.link_types.length === 0 && (
                  <Link href={getLinkLoomLink(cluster, related)}>add</Link>
                )}
              </td>
              <td>{related.articles}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <code>{response.debug_msg}</code>
    </>
  )
}