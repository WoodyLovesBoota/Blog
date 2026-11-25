import { TagsView, tagsMetadata } from "@/views/TagViews";

export const metadata = tagsMetadata("ko");

export default function Page() {
  return <TagsView lang="ko" />;
}
