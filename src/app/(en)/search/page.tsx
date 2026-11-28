import { SearchView, searchMetadata } from "@/views/SearchView";

export const metadata = searchMetadata("en");

export default function Page() {
  return <SearchView lang="en" />;
}
