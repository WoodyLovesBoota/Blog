import { SearchView, searchMetadata } from "@/views/SearchView";

export const metadata = searchMetadata("ko");

export default function Page() {
  return <SearchView lang="ko" />;
}
