import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeCopy } from "@/components/CodeCopy";
import { JsonLd } from "@/components/JsonLd";
import { formatLongDate, postHref, tagHref } from "@/lib/format";
import { htmlLang, localePath, ogLocale, otherLang, t, type Lang } from "@/lib/i18n";
import { renderMarkdown } from "@/lib/markdown";
import { getAdjacentPosts, getAllPosts, getPost } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";
import { alternatesFor } from "./seo";

export const postStaticParams = (lang: Lang) => getAllPosts(lang).map((p) => ({ slug: p.slug }));

export const postMetadata = (lang: Lang, slug: string): Metadata => {
  const post = getPost(lang, slug);
  if (!post) return {};
  const path = `/posts/${post.slug}`;
  const url = localePath(lang, path);

  return {
    title: post.title,
    description: post.description,
    keywords: [...post.keywords, ...post.tags],
    alternates: alternatesFor(lang, path, post.langs),
    openGraph: {
      type: "article",
      url,
      locale: ogLocale[lang],
      alternateLocale: post.langs.filter((l) => l !== lang).map((l) => ogLocale[l]),
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [site.author.name],
      tags: post.tags,
      // image 를 지정하지 않으면 같은 폴더의 opengraph-image.tsx 가 자동으로 붙는다
      ...(post.image && { images: [{ url: post.image }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.image && { images: [post.image] }),
    },
  };
};

export async function PostView({ lang, slug }: { lang: Lang; slug: string }) {
  const post = getPost(lang, slug);
  if (!post) notFound();

  const d = t(lang);
  const html = await renderMarkdown(post.body, lang);
  const { prev, next } = getAdjacentPosts(lang, post.slug);
  const url = absoluteUrl(postHref(post.slug, lang));
  const other = otherLang(lang);
  const hasOther = post.langs.includes(other);

  return (
    <main className="container article">
      <article>
        <header className="article__header">
          <h1 className="article__title">{post.title}</h1>
          <div className="article__meta">
            <time dateTime={post.date}>{formatLongDate(post.date)}</time>
            <span>{post.readingMinutes} min</span>
            {post.tags.map((tag) => (
              <Link key={tag} href={tagHref(tag, lang)} rel="tag">{tag}</Link>
            ))}
            {hasOther && (
              <Link href={postHref(post.slug, other)} hrefLang={htmlLang[other]} lang={htmlLang[other]} className="article__lang">
                {d.readIn}
              </Link>
            )}
          </div>
        </header>

        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        {post.translatedFrom && <p className="article__note">{d.translatedNote(post.translatedFrom)}</p>}
        {post.aiDraft && <p className="article__note">{d.aiDraftNote(site.author.name)}</p>}
      </article>

      <nav className="article__nav" aria-label={d.prevNextNav}>
        {prev && (
          <Link href={postHref(prev.slug, lang)} rel="prev">
            <small>{d.prevPost}</small>
            <span>{prev.title}</span>
          </Link>
        )}
        {next ? (
          <Link href={postHref(next.slug, lang)} rel="next">
            <small>{d.nextPost}</small>
            <span>{next.title}</span>
          </Link>
        ) : (
          <Link href={localePath(lang, "/")}>
            <small>{d.list}</small>
            <span>{d.viewAll}</span>
          </Link>
        )}
      </nav>

      <CodeCopy labels={{ copy: d.copyCode, copied: d.copied }} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          inLanguage: htmlLang[lang],
          url,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          image: post.image ? absoluteUrl(post.image) : `${url}/opengraph-image`,
          keywords: [...post.keywords, ...post.tags].join(", "),
          author: { "@type": "Person", name: site.author.name, url: site.author.github },
          publisher: { "@type": "Person", name: site.author.name },
          ...(hasOther && { workTranslation: { "@type": "BlogPosting", url: absoluteUrl(postHref(post.slug, other)), inLanguage: htmlLang[other] } }),
        }}
      />
    </main>
  );
}
