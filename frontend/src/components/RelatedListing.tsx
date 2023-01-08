import { HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useNodeTypes } from "../selectors";
import { useFetchRelatedClusterListingQuery } from "../services/clusters";
import { ICluster } from "../types";
import { getClusterLink } from "../util";
import PairLink from "./PairLink";
import { SectionLoading, TagType } from "./util";

type RelatedListingProps = {
  cluster: ICluster,
}

export default function RelatedListing({ cluster }: RelatedListingProps) {
  const nodeTypes = useNodeTypes();
  const relatedParams = { clusterId: cluster.id, params: { types: nodeTypes } };
  const { data: listing, isLoading } = useFetchRelatedClusterListingQuery(relatedParams)
  if (listing === undefined || isLoading) {
    return <SectionLoading />
  }

  return (
    <>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
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
              <td><TagType type={related.type} /></td>
              <td>
                <PairLink left={cluster} right={related} link_types={related.link_types} />
              </td>
              <td>{related.articles}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      {/* <code>{listing.debug_msg}</code> */}
    </>
  )
}