import queryString from 'query-string';
import { useFetchRelatedClusterListingQuery } from '../services/clusters';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SectionLoading } from '../components/util';
import { useEffect } from 'react';
import { useNodeTypes } from '../selectors';

export default function LinkerRelated() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nodeTypes = useNodeTypes();
  const anchorId = params.get('anchor');
  if (anchorId === null) {
    navigate('/clusters');
  }
  const relatedParams = { linked: false, limit: 1, _: params.get('previous'), types: nodeTypes };
  const relatedQuery = { clusterId: anchorId + '', params: relatedParams };
  const { data, isLoading } = useFetchRelatedClusterListingQuery(relatedQuery, { refetchOnMountOrArgChange: true })
  useEffect(() => {
    if (data !== undefined && !isLoading) {
      if (data.results.length > 0) {
        const otherId = data.results[0].id;
        navigate(queryString.stringifyUrl({
          'url': `/linker`,
          'query': { anchor: anchorId, other: otherId, related: true }
        }), { replace: true });
      } else {
        navigate(`/clusters/${anchorId}`, { replace: true });
      }
    }
  });
  return <SectionLoading />;
}