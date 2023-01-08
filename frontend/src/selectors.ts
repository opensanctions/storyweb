import { useSelector } from "react-redux";
import { useFetchOntologyQuery } from "./services/ontology";
import { RootState } from "./store";



export function useNodeTypes(): string[] {
  const { data: ontology } = useFetchOntologyQuery();
  const hiddenNodeTypes = useSelector((state: RootState) => state.config.hiddenNodeTypes);
  if (ontology === undefined) {
    return []
  }
  return ontology.cluster_types
    .map((t) => t.name)
    .filter((t) => hiddenNodeTypes.indexOf(t) === -1);
}