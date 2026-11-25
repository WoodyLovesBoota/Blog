import { RootDocument, rootMetadata, rootViewport } from "@/views/RootDocument";
import "@/app/globals.css";

export const metadata = rootMetadata("ko");
export const viewport = rootViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="ko">{children}</RootDocument>;
}
