import { AnchorButton, Button, ButtonGroup, HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useFetchRelatedClusterListingQuery } from "../services/clusters";
import { useExplodeClusterMutation } from "../services/links";
import { ICluster } from "../types";
import { getClusterLink, getLinkLoomLink } from "../util";
import { SectionLoading, TagType } from "./util";

type RelatedListingProps = {
  cluster: ICluster,
}

export default function RelatedListing({ cluster }: RelatedListingProps) {
  const { data: listing, isLoading } = useFetchRelatedClusterListingQuery({ clusterId: cluster.id, params: {} })
  const [explodeCluster, { isLoading: isExploding }] = useExplodeClusterMutation()
  if (listing === undefined || isLoading || isExploding) {
    return <SectionLoading />
  }

  const onExplode = async () => {
    await explodeCluster(cluster.id).unwrap();
  };

  return (
    <>
      <ButtonGroup>
        <AnchorButton href={getLinkLoomLink(cluster)}>Link tool</AnchorButton>
        <Button onClick={onExplode}>Explode</Button>
      </ButtonGroup>
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