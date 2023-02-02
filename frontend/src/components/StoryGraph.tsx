import { useEffect, useState } from "react";
import Graph from "graphology";
import { parse } from "graphology-gexf/browser";
import { ControlsContainer, SigmaContainer, useLoadGraph, useRegisterEvents, ZoomControl } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useFetchStoryGraphQuery } from "../services/stories";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { useFetchOntologyQuery } from "../services/ontology";
import { IStory } from "../types";
import ClusterDrawer from "./ClusterDrawer";

export type StoryGraphProps = {
  story: IStory
}

export const LoadGraph = ({ story }: StoryGraphProps) => {
  const loadGraph = useLoadGraph();
  const { data: ontology } = useFetchOntologyQuery();
  const { assign } = useLayoutForceAtlas2();

  const { data: graphData } = useFetchStoryGraphQuery({ storyId: story.id });

  useEffect(() => {
    if (graphData !== undefined && ontology !== undefined) {
      const graph = parse(Graph, graphData)
      graph.forEachNode((node, attributes) => {
        const type = ontology.cluster_types.find((tp) => tp.name === attributes.node_type);
        attributes.x = Math.random() * 20;
        attributes.y = Math.random() * 20;
        attributes.size = 5 + (1.5 * graph.degree(node));
        attributes.color = type?.color || '#dddddd';
      });
      graph.forEachEdge((edge, attributes) => {
        const type = ontology.link_types.find((t) => t.name === attributes.edge_type);
        attributes.size = 2;
        attributes.label = type?.label;
      });
      loadGraph(graph);
      assign();
    }
    // console.log(positions());
  }, [loadGraph, assign, ontology, graphData]);

  return null;
};

type GraphEventsProps = {
  showCluster: (id: string) => void
}

function GraphEvents({ showCluster }: GraphEventsProps) {
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    registerEvents({
      clickNode: (event) => showCluster(event.node),
      doubleClickNode: (event) => showCluster(event.node),
      // clickEdge: (event) => console.log("clickEdge", event.event, event.edge, event.preventSigmaDefault),
      // doubleClickEdge: (event) => console.log("doubleClickEdge", event.event, event.edge, event.preventSigmaDefault),
      // wheel: (event) => event.preventSigmaDefault(),
    });
  }, [registerEvents, showCluster]);

  return null;
}

export default function StoryGraph({ story }: StoryGraphProps) {
  const [showCluster, setShowCluster] = useState<string | undefined>();

  return (
    <>
      <ClusterDrawer
        clusterId={showCluster}
        onClose={(e) => setShowCluster(undefined)}
      />
      <SigmaContainer style={{ height: "500px", width: "100%" }} settings={{
        zIndex: true,
        renderEdgeLabels: true
      }}>
        <LoadGraph story={story} />
        <GraphEvents showCluster={setShowCluster} />
        <ControlsContainer position={"bottom-right"}>
          <ZoomControl />
        </ControlsContainer>
      </SigmaContainer>
    </>
  );
}