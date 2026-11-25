import type { MetadataRoute } from "next";
import { postHref, tagHref } from "@/lib/format";
import { LANGS, localePath, type Lang } from "@/lib/i18n";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";
import { sitemapAlternates } from "@/views/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const lang of LANGS) {
    const posts = getAllPosts(lang);
    const latest = posts[0] ? (posts[0].updated ?? posts[0].date) : undefined;
    const page = (path: string, extra: Partial<MetadataRoute.Sitemap[number]>) =>
      entries.push({ url: absoluteUrl(localePath(lang, path)), alternates: sitemapAlternates(path, LANGS), ...extra });

    page("/", { lastModified: latest, changeFrequency: "weekly", priority: 1 });
    page("/tags", { lastModified: latest, changeFrequency: "weekly", priority: 0.5 });
    page("/about", { changeFrequency: "yearly", priority: 0.3 });

    for (const p of posts) {
      entries.push({
        url: absoluteUrl(postHref(p.slug, lang)),
        lastModified: p.updated ?? p.date,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: sitemapAlternates(`/posts/${p.slug}`, p.langs),
      });
    }

    const tagLangs = (tag: string): Lang[] => LANGS.filter((l) => getAllTags(l).some((t) => t.name === tag));
    for (const t of getAllTags(lang)) {
      entries.push({
        url: absoluteUrl(tagHref(t.name, lang)),
        changeFrequency: "weekly",
        priority: 0.4,
        alternates: sitemapAlternates(`/tags/${encodeURIComponent(t.name)}`, tagLangs(t.name)),
      });
    }
  }

  return entries;
}
