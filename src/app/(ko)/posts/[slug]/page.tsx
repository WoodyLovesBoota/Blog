import type { Metadata } from "next";
import { PostView, postMetadata, postStaticParams } from "@/views/PostView";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => postStaticParams("ko");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return postMetadata("ko", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <PostView lang="ko" slug={(await params).slug} />;
}
