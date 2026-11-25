import { AboutView, aboutMetadata } from "@/views/AboutView";

export const metadata = aboutMetadata("ko");

export default function Page() {
  return <AboutView lang="ko" />;
}
