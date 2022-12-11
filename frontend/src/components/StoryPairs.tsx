import { HTMLTable } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useFetchStoryPairsQuery } from "../services/stories";
import { getClusterLink } from "../util";
import PairLink from "./PairLink";
import { ErrorSection, Numeric, SectionLoading, Spacer, TagType } from "./util";

type StoryPairsProps = {
    storyId: number,
}

export default function StoryPairs({ storyId }: StoryPairsProps) {
    const { data: clusters, error: clustersError } = useFetchStoryPairsQuery({
        storyId: storyId,
        params: {}
    });

    if (clustersError !== undefined) {
        return <ErrorSection title="Could not load story-related entity pairs" />
    }
    if (clusters === undefined) {
        return <SectionLoading />
    }

    return (
        <HTMLTable condensed bordered className="wide">
            <thead>
                <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Links</th>
                    <th className="numeric">Articles</th>
                </tr>
            </thead>
            <tbody>
                {clusters.results.map((pair) => (
                    <tr key={pair.left.id + pair.right.id}>
                        <td>
                            <Link to={getClusterLink(pair.left)}>{pair.left.label}</Link>
                            <Spacer />
                            <TagType type={pair.left.type} />
                        </td>
                        <td>
                            <Link to={getClusterLink(pair.right)}>{pair.right.label}</Link>
                            <Spacer />
                            <TagType type={pair.right.type} />
                        </td>
                        <td>
                            <PairLink left={pair.left} right={pair.right} link_types={pair.link_types} />
                        </td>
                        <td className="numeric">
                            <Numeric value={pair.articles} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </HTMLTable>
    )
};