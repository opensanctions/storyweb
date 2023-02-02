import { createBrowserRouter, useRouteError } from "react-router-dom";
import ArticleIndex from "./screens/ArticleIndex";
import ClusterIndex from "./screens/ClusterIndex";
import ClusterView from "./screens/ClusterView";
// import HomePage from "./screens/Home";
import Layout from "./screens/Layout";
import Linker from "./screens/Linker";
import LinkerRelated from "./screens/LinkerRelated";
import StoryIndex from "./screens/StoryIndex";
import StoryLinker from "./screens/StoryLinker";
import StoryView from "./screens/StoryView";

interface IRouteError {
  statusText?: string
  message: string
}

function ErrorPage() {
  const error = useRouteError() as IRouteError;

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <StoryIndex />
      },
      {
        path: "stories/:storyId",
        element: <StoryView />
      },
      {
        path: "stories/:storyId/linker",
        element: <StoryLinker />
      },
      {
        path: "articles",
        element: <ArticleIndex />,
      },
      {
        path: "clusters",
        element: <ClusterIndex />,
      },
      {
        path: "clusters/:clusterId",
        element: <ClusterView />,
      },
      {
        path: "linker",
        element: <Linker />,
      },
      {
        path: "linker/related",
        element: <LinkerRelated />,
      },
    ],
  },
]);


