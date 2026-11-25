import type { Metadata } from "next";
import { Suspense } from "react";
import { Search, type SearchDoc } from "@/components/Search";
import { t, type Lang } from "@/lib/i18n";
import { getAllPosts, getPost, toPlainText } from "@/lib/posts";
import { alternatesFor } from "./seo";

export const searchMetadata = (lang: Lang): Metadata => ({
  title: t(lang).search,
  description: t(lang).searchDescription,
  alternates: alternatesFor(lang, "/search"),
  // 검색 결과 페이지는 색인하지 않는다
  robots: { index: false, follow: true },
});

export function SearchView({ lang }: { lang: Lang }) {
  const d = t(lang);
  const docs: SearchDoc[] = getAllPosts(lang).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    tags: p.tags,
    keywords: p.keywords,
    text: toPlainText(getPost(lang, p.slug)?.body ?? ""),
  }));

  return (
    <main className="container page" style={{ gap: 32 }}>
      <h1 className="sr-only">{d.search}</h1>
      <Suspense>
        <Search
          docs={docs}
          lang={lang}
          labels={{
            search: d.search,
            placeholder: d.searchPlaceholder,
            hint: d.searchHint,
            browseTags: d.browseTags,
            resultCount: d.resultCount(0).replace("0", "{n}"),
          }}
        />
      </Suspense>
    </main>
  );
}
