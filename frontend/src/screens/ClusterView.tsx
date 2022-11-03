import { useParams } from "react-router-dom";
import { ErrorSection, SectionLoading, SpacedList, Spacer, TagCategory, TagLabel } from "../components/util";
import { useFetchClusterQuery } from "../services/clusters";

export default function ClusterView() {
  const { clusterId } = useParams();
  const { data: cluster, error } = useFetchClusterQuery(clusterId as string);
  if (error !== undefined) {
    return <ErrorSection title="Could not load the article" />
  }
  if (cluster === undefined) {
    return <SectionLoading />
  }
  return (
    <div>
      <h1>
        <TagLabel label={cluster.label} />
      </h1>
      <p>
        <TagCategory category={cluster.category} /> <Spacer />
        Aliases:{' '}
        <SpacedList values={cluster.labels.map((l) => <TagLabel key={l} label={l} />)} />
      </p>
      {/* <p>
        Site: {article.site} <Spacer />
        <a href={article.url}>{article.url}</a>
      </p> */}
    </div>
  )
}
