import { ogSize, postOgImage } from "@/views/og";
import { postStaticParams } from "@/views/PostView";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = ogSize;
export const contentType = "image/png";
export const generateStaticParams = () => postStaticParams("en");

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return postOgImage("en", (await params).slug);
}
