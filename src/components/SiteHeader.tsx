"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "./SearchIcon";
import { htmlLang, localePath, otherLang, splitLocale, t, type Lang } from "@/lib/i18n";

const NAV = [
  { path: "/", label: "Posts", match: (p: string) => p === "/" || p.startsWith("/posts") },
  { path: "/tags", label: "Tags", match: (p: string) => p.startsWith("/tags") },
  { path: "/about", label: "About", match: (p: string) => p.startsWith("/about") },
];

/** 다른 언어의 같은 페이지. 그 언어에 없는 글·태그면 해당 언어의 목록으로 보낸다. */
const switchTarget = (path: string, to: Lang, slugs: Record<Lang, string[]>) => {
  const post = path.match(/^\/posts\/([^/]+)/);
  if (post) return slugs[to].includes(decodeURIComponent(post[1])) ? localePath(to, path) : localePath(to, "/");
  if (path.startsWith("/tags/")) return localePath(to, "/tags");
  return localePath(to, path);
};

export function SiteHeader({ lang, slugs }: { lang: Lang; slugs: Record<Lang, string[]> }) {
  const { path } = splitLocale(usePathname());
  const current = (on: boolean) => (on ? ("page" as const) : undefined);
  const d = t(lang);
  const other = otherLang(lang);

  return (
    <header className="container site-header">
      <Link href={localePath(lang, "/")} className="logo">
        woody<span>.</span>dev
      </Link>
      <nav className="nav" aria-label={d.mainNav}>
        {NAV.map((item) => (
          <Link key={item.path} href={localePath(lang, item.path)} aria-current={current(item.match(path))}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="site-header__tools">
        <Link
          href={switchTarget(path, other, slugs)}
          className="lang-link"
          hrefLang={htmlLang[other]}
          lang={htmlLang[other]}
          aria-label={d.switchLang}
        >
          {other.toUpperCase()}
        </Link>
        <Link href={localePath(lang, "/search")} className="icon-link" aria-label={d.search} aria-current={current(path === "/search")}>
          <SearchIcon />
        </Link>
      </div>
    </header>
  );
}
