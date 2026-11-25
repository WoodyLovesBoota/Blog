import { rssResponse } from "@/views/rss";

export const dynamic = "force-static";

export function GET() {
  return rssResponse("ko");
}
