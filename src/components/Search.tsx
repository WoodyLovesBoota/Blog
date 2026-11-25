"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { SearchIcon } from "./SearchIcon";
import { formatDotDate, postHref } from "@/lib/format";
import { localePath, type Lang } from "@/lib/i18n";

export type SearchDoc = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  keywords: string[];
  text: string;
};

const SNIPPET_RADIUS = 40;

const makeSnippet = (doc: SearchDoc, term: string) => {
  const source = doc.text || doc.description;
  const i = source.toLowerCase().indexOf(term);
  if (i < 0) return { before: doc.description, hit: "", after: "" };
  const start = Math.max(0, i - SNIPPET_RADIUS);
  const end = Math.min(source.length, i + term.length + SNIPPET_RADIUS * 2);
  return {
    before: (start > 0 ? "…" : "") + source.slice(start, i),
    hit: source.slice(i, i + term.length),
    after: source.slice(i + term.length, end) + (end < source.length ? "…" : ""),
  };
};

type Labels = { search: string; placeholder: string; hint: string; browseTags: string; /** "{n}" 자리에 개수 */ resultCount: string };

export function Search({ docs, lang, labels }: { docs: SearchDoc[]; lang: Lang; labels: Labels }) {
  const searchPath = localePath(lang, "/search");
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    const terms = deferred.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return docs
      .map((doc) => {
        const title = doc.title.toLowerCase();
        const meta = [doc.description, ...doc.tags, ...doc.keywords].join(" ").toLowerCase();
        const text = doc.text.toLowerCase();
        let score = 0;
        for (const t of terms) {
          const s = (title.includes(t) ? 10 : 0) + (meta.includes(t) ? 4 : 0) + (text.includes(t) ? 1 : 0);
          if (s === 0) return null; // 모든 단어가 어딘가엔 있어야 한다
          score += s;
        }
        return { doc, score, snippet: makeSnippet(doc, terms[0]) };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score || b.doc.date.localeCompare(a.doc.date));
  }, [deferred, docs]);

  const update = (value: string) => {
    setQuery(value);
    const q = value.trim();
    router.replace(q ? `${searchPath}?q=${encodeURIComponent(q)}` : searchPath, { scroll: false });
  };

  return (
    <>
      <form role="search" className="search-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q">{labels.search}</label>
        <div className="search-field">
          <SearchIcon />
          <input
            id="q"
            type="search"
            autoFocus
            autoComplete="off"
            placeholder={labels.placeholder}
            value={query}
            onChange={(e) => update(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && update("")}
          />
          <span className="kbd" aria-hidden="true">esc</span>
        </div>
      </form>

      {deferred.trim() && (
        <section className="section" aria-live="polite">
          <h2 className="section-label">{labels.resultCount.replace("{n}", String(results.length))}</h2>
          {results.map(({ doc, snippet }) => (
            <Link key={doc.slug} href={postHref(doc.slug, lang)} className="post-row post-row--stacked">
              <span className="post-row__line">
                <span className="post-row__title">{doc.title}</span>
                <span className="post-row__meta">
                  {doc.tags[0] && <span className="post-row__tag">{doc.tags[0]}</span>}
                  <time className="post-row__date" dateTime={doc.date}>{formatDotDate(doc.date)}</time>
                </span>
              </span>
              <span className="post-row__snippet">
                {snippet.before}
                {snippet.hit && <mark>{snippet.hit}</mark>}
                {snippet.after}
              </span>
            </Link>
          ))}
        </section>
      )}

      <p className="hint">
        {labels.hint} <Link href={localePath(lang, "/tags")}>{labels.browseTags}</Link>
      </p>
    </>
  );
}
