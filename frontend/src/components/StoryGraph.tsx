import { useEffect } from "react";
import Graph from "graphology";
import { parse } from "graphology-gexf/browser";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useFetchStoryGraphQuery } from "../services/stories";
import { useLayoutForceAtlas2, useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { useFetchOntologyQuery } from "../services/ontology";
import { useLayoutCircular } from "@react-sigma/layout-circular";

export type StoryGraphProps = {
    storyId: number
}

const Fa2: React.FC = () => {
    const { start, kill, isRunning } = useWorkerLayoutForceAtlas2({ settings: { slowDown: 10 } });
    useEffect(() => {
        // start FA2
        start();
        return () => {
            // Kill FA2 on unmount
            kill();
        };
    }, [start, kill]);
    return null;
};

export const LoadGraph = ({ storyId }: StoryGraphProps) => {
    const loadGraph = useLoadGraph();
    // const { data: ontology } = useFetchOntologyQuery();
    // const { positions, assign } = useLayoutForceAtlas2();
    const { positions, assign } = useLayoutCircular();

    const { data: graphData, isLoading, error } = useFetchStoryGraphQuery({ storyId });

    useEffect(() => {
        if (graphData !== undefined) {
            const graph = parse(Graph, graphData)
            graph.forEachNode((node, attributes) => {
                // const type = ontology.cluster_types.find((tp) => tp.name === attributes.node_type);
                attributes.x = 0;
                attributes.y = 0;
                attributes.size = 5 + (1.5 * graph.degree(node));
                attributes.color = 'green';
            });
            loadGraph(graph);
        }
        assign();
        console.log(positions());
    }, [loadGraph, assign, graphData]);

    return null;
};

export default function StoryGraph({ storyId }: StoryGraphProps) {
    return (
        <SigmaContainer style={{ height: "500px", width: "100%" }}>
            <LoadGraph storyId={storyId} />
            {/* <Fa2 /> */}
        </SigmaContainer>
    );
}