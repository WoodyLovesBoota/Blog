import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostRow } from "@/components/PostRow";
import { TagCloud } from "@/components/TagCloud";
import { LANGS, localePath, t, type Lang } from "@/lib/i18n";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { alternatesFor } from "./seo";

const decode = (raw: string) => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/** 태그가 존재하는 언어들 */
const tagLangs = (tag: string) => LANGS.filter((l) => getPostsByTag(l, tag).length > 0);

export const tagsMetadata = (lang: Lang): Metadata => ({
  title: t(lang).tags,
  description: t(lang).tagsDescription,
  alternates: alternatesFor(lang, "/tags"),
});

export function TagsView({ lang }: { lang: Lang }) {
  const tags = getAllTags(lang);
  return (
    <main className="container page">
      <section className="section" style={{ gap: 16 }}>
        <h1 className="section-label" style={{ margin: 0 }}>{t(lang).tagCount(tags.length)}</h1>
        <TagCloud tags={tags} lang={lang} />
      </section>
    </main>
  );
}

export const tagStaticParams = (lang: Lang) => getAllTags(lang).map((tag) => ({ tag: tag.name }));

export const tagMetadata = (lang: Lang, rawTag: string): Metadata => {
  const tag = decode(rawTag);
  const count = getPostsByTag(lang, tag).length;
  return {
    title: `#${tag}`,
    description: t(lang).tagPostsDescription(tag, count),
    alternates: alternatesFor(lang, `/tags/${encodeURIComponent(tag)}`, tagLangs(tag)),
  };
};

export function TagView({ lang, rawTag }: { lang: Lang; rawTag: string }) {
  const d = t(lang);
  const tag = decode(rawTag);
  const posts = getPostsByTag(lang, tag);
  if (posts.length === 0) notFound();
  const tags = getAllTags(lang);

  return (
    <main className="container page">
      <section className="section" style={{ gap: 16 }}>
        <h2 className="section-label" style={{ margin: 0 }}>{d.tagCount(tags.length)}</h2>
        <TagCloud tags={tags} current={tag} lang={lang} />
      </section>

      <section className="section">
        <div className="tag-heading">
          <h1>
            <span>{tag}</span> <span>{d.postCount(posts.length)}</span>
          </h1>
          <Link href={localePath(lang, "/tags")}>{d.allTags}</Link>
        </div>
        {posts.map((post) => (
          <PostRow key={post.slug} post={post} lang={lang} dateFormat="full" primaryTag={tag} />
        ))}
      </section>
    </main>
  );
}
