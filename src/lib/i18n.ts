/**
 * 다국어 설정. 한국어가 기본(접두사 없음), 영어는 /en 아래.
 *
 *   /posts/foo      ← content/posts/foo.md
 *   /en/posts/foo   ← content/posts/foo.en.md
 *
 * 같은 slug 를 공유하므로 언어 전환은 접두사만 바꾸면 된다.
 */
export const LANGS = ["ko", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ko";

export const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang);
export const otherLang = (lang: Lang): Lang => (lang === "ko" ? "en" : "ko");

/** 언어별 경로. localePath("en", "/posts/a") → "/en/posts/a", localePath("en", "/") → "/en" */
export const localePath = (lang: Lang, path = "/") => {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return p;
  return p === "/" ? `/${lang}` : `/${lang}${p}`;
};

/** 현재 경로에서 언어 접두사를 떼어 낸다. "/en/tags" → { lang: "en", path: "/tags" } */
export const splitLocale = (pathname: string): { lang: Lang; path: string } => {
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue;
    if (pathname === `/${lang}`) return { lang, path: "/" };
    if (pathname.startsWith(`/${lang}/`)) return { lang, path: pathname.slice(lang.length + 1) };
  }
  return { lang: DEFAULT_LANG, path: pathname };
};

export const htmlLang: Record<Lang, string> = { ko: "ko", en: "en" };
export const ogLocale: Record<Lang, string> = { ko: "ko_KR", en: "en_US" };
export const langName: Record<Lang, string> = { ko: "한국어", en: "English" };

export const dict = {
  ko: {
    siteDescription: "일하면서 부딪힌 문제와 그걸 풀어간 과정을 정리하는 개발 블로그",
    allPosts: "전체 글",
    noPosts: "아직 글이 없습니다.",
    prevPost: "이전 글",
    nextPost: "다음 글",
    list: "목록",
    viewAll: "전체 글 보기",
    prevNextNav: "이전 다음 글",
    aiDraftNote: (author: string) => `Claude가 초안을 쓰고 ${author}가 검수했습니다.`,
    translatedNote: (from: Lang) => `이 글은 ${from === "en" ? "영어" : "한국어"} 원문을 번역했습니다.`,
    readIn: "Read in English",
    tags: "태그",
    tagsDescription: "주제별로 모아 본 글 목록",
    tagCount: (n: number) => `태그 ${n}개`,
    postCount: (n: number) => `글 ${n}개`,
    tagPostsDescription: (tag: string, n: number) => `${tag} 태그가 달린 글 ${n}개`,
    allTags: "전체 태그",
    search: "검색",
    searchDescription: "제목, 본문, 태그로 글 찾기",
    searchPlaceholder: "제목, 본문, 태그로 찾기",
    resultCount: (n: number) => `결과 ${n}개`,
    searchHint: "원하는 글이 없나요?",
    browseTags: "태그로 둘러보기",
    mainNav: "주요 메뉴",
    externalLinks: "외부 링크",
    switchLang: "언어 전환",
    notFound: "찾는 페이지가 없습니다.",
    backToList: "글 목록으로",
    copyCode: "코드 복사",
    copied: "복사됨",
    about: "소개",
    aboutDescription: (author: string) => `${author} 소개와 연락처`,
  },
  en: {
    siteDescription: "Notes on problems I ran into at work and how I worked through them",
    allPosts: "All posts",
    noPosts: "No posts yet.",
    prevPost: "Previous",
    nextPost: "Next",
    list: "Index",
    viewAll: "All posts",
    prevNextNav: "Previous and next posts",
    aiDraftNote: (author: string) => `Drafted by Claude, reviewed by ${author}.`,
    translatedNote: (from: Lang) => `Translated from the ${from === "ko" ? "Korean" : "English"} original.`,
    readIn: "한국어로 읽기",
    tags: "Tags",
    tagsDescription: "Posts grouped by topic",
    tagCount: (n: number) => `${n} tag${n === 1 ? "" : "s"}`,
    postCount: (n: number) => `${n} post${n === 1 ? "" : "s"}`,
    tagPostsDescription: (tag: string, n: number) => `${n} post${n === 1 ? "" : "s"} tagged ${tag}`,
    allTags: "All tags",
    search: "Search",
    searchDescription: "Find posts by title, body or tag",
    searchPlaceholder: "Search titles, posts and tags",
    resultCount: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
    searchHint: "Can't find it?",
    browseTags: "Browse by tag",
    mainNav: "Main",
    externalLinks: "External links",
    switchLang: "Switch language",
    notFound: "This page doesn't exist.",
    backToList: "Back to posts",
    copyCode: "Copy code",
    copied: "Copied",
    about: "About",
    aboutDescription: (author: string) => `About ${author} and how to get in touch`,
  },
} satisfies Record<Lang, Record<string, unknown>>;

export type Dict = (typeof dict)["ko"];
export const t = (lang: Lang): Dict => dict[lang];
