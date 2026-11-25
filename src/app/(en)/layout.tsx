import { RootDocument, rootMetadata, rootViewport } from "@/views/RootDocument";
import "@/app/globals.css";

export const metadata = rootMetadata("en");
export const viewport = rootViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
