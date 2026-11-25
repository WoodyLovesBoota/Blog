import { PostRow } from "@/components/PostRow";
import { JsonLd } from "@/components/JsonLd";
import { htmlLang, localePath, t, type Lang } from "@/lib/i18n";
import { getAllPosts, type PostMeta } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";

export function HomeView({ lang }: { lang: Lang }) {
  const d = t(lang);
  const posts = getAllPosts(lang);
  const years = Map.groupBy(posts, (p: PostMeta) => p.date.slice(0, 4));

  return (
    <main className="container page">
      <h1 className="sr-only">{site.name} {d.allPosts}</h1>
      {posts.length === 0 && <p className="empty">{d.noPosts}</p>}
      {[...years].map(([year, list]) => (
        <section key={year} className="section" aria-labelledby={`y-${year}`}>
          <h2 id={`y-${year}`} className="section-label">{year}</h2>
          {list.map((post) => (
            <PostRow key={post.slug} post={post} lang={lang} />
          ))}
        </section>
      ))}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: site.name,
          description: d.siteDescription,
          url: absoluteUrl(localePath(lang, "/")),
          inLanguage: htmlLang[lang],
          author: { "@type": "Person", name: site.author.name, url: site.author.github },
        }}
      />
    </main>
  );
}
