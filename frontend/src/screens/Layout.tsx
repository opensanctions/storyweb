import { Outlet } from "react-router-dom";
import { useFetchOntologyQuery } from "../services/ontology";

export default function Layout() {
  const { data: ontology, error: ontologyError, isLoading: ontologyLoading } = useFetchOntologyQuery();
  console.log(ontology);
  return (
    <div className="layout">
      <Outlet />
    </div>
  )
}
