import type { Metadata } from "next";
import { DEFAULT_LANG, LANGS, localePath, type Lang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

/**
 * hreflang 대체 링크. `langs` 는 이 페이지가 실제로 존재하는 언어만 넘긴다.
 * x-default 는 기본 언어(없으면 있는 언어 중 첫 번째).
 */
export const languageAlternates = (path: string, langs: readonly Lang[] = LANGS) => {
  const languages: Record<string, string> = {};
  for (const l of langs) languages[l] = localePath(l, path);
  const def = langs.includes(DEFAULT_LANG) ? DEFAULT_LANG : langs[0];
  if (def) languages["x-default"] = localePath(def, path);
  return languages;
};

/** 페이지 metadata 의 alternates: canonical(자기 언어) + hreflang */
export const alternatesFor = (lang: Lang, path: string, langs: readonly Lang[] = LANGS): Metadata["alternates"] => ({
  canonical: localePath(lang, path),
  languages: langs.length > 1 ? languageAlternates(path, langs) : undefined,
});

/** sitemap 용 절대 URL 대체 링크 */
export const sitemapAlternates = (path: string, langs: readonly Lang[]) =>
  langs.length > 1
    ? { languages: Object.fromEntries(Object.entries(languageAlternates(path, langs)).map(([k, v]) => [k, absoluteUrl(v)])) }
    : undefined;
