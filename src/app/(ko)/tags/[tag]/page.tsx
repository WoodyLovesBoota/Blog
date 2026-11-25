import type { Metadata } from "next";
import { TagView, tagMetadata, tagStaticParams } from "@/views/TagViews";

type Props = { params: Promise<{ tag: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => tagStaticParams("ko");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return tagMetadata("ko", (await params).tag);
}

export default async function Page({ params }: Props) {
  return <TagView lang="ko" rawTag={(await params).tag} />;
}
