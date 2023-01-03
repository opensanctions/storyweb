import { Breadcrumbs2 } from "@blueprintjs/popover2"
import { useFetchStoryQuery } from "../services/stories"

type StoryLinkerBannerProps = {
  storyId: string,
}

export default function StoryLinkerBanner({ storyId }: StoryLinkerBannerProps) {
  const { data: story, isLoading } = useFetchStoryQuery(storyId)

  if (story === undefined || isLoading) {
    return null
  }
  return (
    <Breadcrumbs2 items={[{ href: `/stories/${storyId}`, icon: "projects", text: story.title }]} />
  )
}