import { TagsView, tagsMetadata } from "@/views/TagViews";

export const metadata = tagsMetadata("en");

export default function Page() {
  return <TagsView lang="en" />;
}
