import { postHref } from "@/lib/format";
import { htmlLang, localePath, t, type Lang } from "@/lib/i18n";
import { getAllPosts } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const rfc822 = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString();

export function rssResponse(lang: Lang) {
  const posts = getAllPosts(lang);
  const items = posts
    .map((p) => {
      const url = absoluteUrl(postHref(p.slug, lang));
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(p.description)}</description>
      <pubDate>${rfc822(p.date)}</pubDate>
${p.tags.map((tag) => `      <category>${esc(tag)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const self = absoluteUrl(localePath(lang, "/rss.xml"));
  const latest = posts[0] ? `    <lastBuildDate>${rfc822(posts[0].updated ?? posts[0].date)}</lastBuildDate>\n` : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${absoluteUrl(localePath(lang, "/"))}</link>
    <description>${esc(t(lang).siteDescription)}</description>
    <language>${htmlLang[lang]}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${latest}${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
