import { AnchorButton, ButtonGroup, HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useFetchRelatedClusterListingQuery } from "../services/clusters";
import { ICluster } from "../types";
import { getClusterLink, getLinkLoomLink } from "../util";
import { SectionLoading } from "./util";

type RelatedListingProps = {
  cluster: ICluster,
}

export default function RelatedListing({ cluster }: RelatedListingProps) {
  const { data: listing } = useFetchRelatedClusterListingQuery({ cluster, params: {} })
  if (listing === undefined) {
    return <SectionLoading />
  }
  return (
    <>
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
          {listing.results.map((related) => (
            <tr key={related.id}>
              <td>
                <Link to={getClusterLink(related)}>{related.label}</Link>
              </td>
              <td><code>{related.category}</code></td>
              <td>
                {related.link_types.length > 0 && (
                  <Link to={getLinkLoomLink(cluster, related)}><>{related.link_types}</></Link>
                )}
                {related.link_types.length === 0 && (
                  <Link to={getLinkLoomLink(cluster, related)}>add</Link>
                )}
              </td>
              <td>{related.articles}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <code>{listing.debug_msg}</code>
    </>
  )
}