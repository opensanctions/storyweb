import queryString from 'query-string';
import { AnchorButton, Button, ButtonGroup, Intent } from "@blueprintjs/core";
import { useExplodeClusterMutation } from "../services/links";
import { ICluster } from "../types";
import { getLinkLoomLink } from "../util";
import { LINKER_ICON } from '../constants';

type ClusterButtonGroupProps = {
  cluster: ICluster,
}

export default function ClusterButtonGroup({ cluster }: ClusterButtonGroupProps) {
  const [explodeCluster, { isLoading: isExploding }] = useExplodeClusterMutation();

  const onExplode = async () => {
    await explodeCluster(cluster.id).unwrap();
  };

  const disabled = isExploding;
  const googleUrl = queryString.stringifyUrl({ url: 'https://www.google.com/search', query: { q: cluster.label } });
  const sanctionsUrl = queryString.stringifyUrl({ url: 'https://www.opensanctions.org/search', query: { q: cluster.label } });
  return (
    <ButtonGroup>
      <AnchorButton icon={LINKER_ICON} intent={Intent.PRIMARY} href={getLinkLoomLink(cluster)} disabled={disabled}>
        Build web
      </AnchorButton>
      <AnchorButton href={googleUrl} disabled={disabled} icon="search-text">Google</AnchorButton>
      <AnchorButton href={sanctionsUrl} disabled={disabled} icon="search-text">OpenSanctions</AnchorButton>
      <Button icon="graph-remove" intent={Intent.DANGER} onClick={onExplode} disabled={disabled}>Explode</Button>
    </ButtonGroup>
  )
}