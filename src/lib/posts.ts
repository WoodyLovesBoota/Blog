import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { CONTENT_BASE_LANG, LANGS, isLang, type Lang } from "./i18n";

/**
 * 글 저장소: content/posts/<slug>.md (한국어) + content/posts/<slug>.en.md (영어)
 * 파일명이 곧 URL slug 이고, 두 언어가 같은 slug 를 공유한다.
 *
 * ---
 * title: 글 제목                (필수, 언어별)
 * description: 한두 문장 요약    (필수, 언어별)
 * date: 2026-11-21             (필수*, 발행일)
 * updated: 2026-11-25          (선택*, 수정일 → article:modified_time, sitemap lastmod)
 * tags: [go, postgres]         (선택*, 태그 페이지 / 검색)
 * image: /images/cover.png     (선택*, 없으면 OG 이미지를 자동 생성)
 * keywords: [커넥션 풀, pgx]    (선택, 언어별)
 * draft: true                  (선택, 언어별. 프로덕션 빌드에서 제외)
 * aiDraft: true                (선택, 언어별. 글 하단에 "AI 초안 + 검수" 표기)
 * translatedFrom: ko           (선택, 언어별. 번역본이면 원문 언어)
 * ---
 *
 * * 표시 필드(date, updated, tags, image)는 글 단위로 공유한다.
 *   한국어 파일이 있으면 한국어 파일 값을 쓰고, 영어 파일에는 적지 않아도 된다.
 *   영어 파일만 있는 글은 영어 파일 값을 쓴다.
 */
const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  lang: Lang;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  keywords: string[];
  image?: string;
  draft: boolean;
  aiDraft: boolean;
  translatedFrom?: Lang;
  readingMinutes: number;
  /** 이 글이 존재하는 언어 (자기 자신 포함, draft 제외 규칙 적용 후) */
  langs: Lang[];
};

export type Post = PostMeta & { body: string };

type RawFile = { file: string; slug: string; lang: Lang; data: Record<string, unknown>; body: string };

const toISODate = (value: unknown, field: string, file: string): string => {
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new Error(`[posts] ${file}: "${field}" 날짜 형식이 잘못됨 (${String(value)})`);
  return d.toISOString().slice(0, 10);
};

const toList = (value: unknown): string[] => {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(arr.map((v) => String(v).trim()).filter(Boolean))];
};

// 한국어 약 500자/분, 영문 약 220단어/분 기준의 대략적인 읽기 시간
const readingTime = (body: string) => {
  const text = body.replace(/```[\s\S]*?```/g, " ");
  const hangul = (text.match(/[가-힣]/g) ?? []).length;
  const words = text.replace(/[가-힣]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(hangul / 500 + words / 220));
};

/** foo.md → (foo, ko), foo.en.md → (foo, en) */
const parseName = (fileName: string): { slug: string; lang: Lang } => {
  const base = fileName.replace(/\.md$/, "");
  const m = base.match(/^(.*)\.([a-z]{2})$/);
  if (m && isLang(m[2]) && m[2] !== CONTENT_BASE_LANG) return { slug: m[1], lang: m[2] };
  return { slug: base, lang: CONTENT_BASE_LANG };
};

const readRaw = (fileName: string): RawFile => {
  const { slug, lang } = parseName(fileName);
  const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8"));
  return { file: fileName, slug, lang, data, body: content };
};

const showDrafts = process.env.NODE_ENV !== "production";

const build = (own: RawFile, shared: RawFile): Post => {
  for (const field of ["title", "description"] as const) {
    if (!own.data[field]) throw new Error(`[posts] ${own.file}: frontmatter "${field}" 가 없음`);
  }
  const date = shared.data.date ?? own.data.date;
  if (!date) throw new Error(`[posts] ${shared.file}: frontmatter "date" 가 없음`);
  const pick = (k: string) => shared.data[k] ?? own.data[k];
  const from = own.data.translatedFrom;

  return {
    slug: own.slug,
    lang: own.lang,
    title: String(own.data.title),
    description: String(own.data.description),
    date: toISODate(date, "date", shared.file),
    updated: pick("updated") ? toISODate(pick("updated"), "updated", shared.file) : undefined,
    tags: toList(pick("tags")).map((t) => t.toLowerCase()),
    keywords: toList(own.data.keywords),
    image: pick("image") ? String(pick("image")) : undefined,
    draft: own.data.draft === true,
    aiDraft: own.data.aiDraft === true,
    translatedFrom: isLang(from) ? from : undefined,
    readingMinutes: readingTime(own.body),
    langs: [],
    body: own.body,
  };
};

const sortPosts = (a: PostMeta, b: PostMeta) =>
  a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date);

/** 언어별 글 목록 (최신순). draft 는 개발 서버에서만 포함. */
const loadAll = cache((): Record<Lang, Post[]> => {
  const out = Object.fromEntries(LANGS.map((l) => [l, [] as Post[]])) as Record<Lang, Post[]>;
  if (!fs.existsSync(POSTS_DIR)) return out;

  const bySlug = new Map<string, Partial<Record<Lang, RawFile>>>();
  for (const f of fs.readdirSync(POSTS_DIR)) {
    if (!f.endsWith(".md") || f.startsWith("_")) continue;
    const raw = readRaw(f);
    const entry = bySlug.get(raw.slug) ?? {};
    entry[raw.lang] = raw;
    bySlug.set(raw.slug, entry);
  }

  for (const files of bySlug.values()) {
    const shared = files[CONTENT_BASE_LANG] ?? Object.values(files)[0]!;
    const posts = LANGS.flatMap((l) => (files[l] ? [build(files[l], shared)] : [])).filter((p) => showDrafts || !p.draft);
    const langs = posts.map((p) => p.lang);
    for (const p of posts) out[p.lang].push({ ...p, langs });
  }

  for (const l of LANGS) out[l].sort(sortPosts);
  return out;
});

const stripBody = ({ body: _body, ...meta }: Post): PostMeta => meta;

/** 최신순 전체 글 (본문 제외) */
export const getAllPosts = (lang: Lang): PostMeta[] => loadAll()[lang].map(stripBody);

export const getPost = (lang: Lang, slug: string): Post | undefined => loadAll()[lang].find((p) => p.slug === slug);

/** 언어별로 존재하는 slug 목록 (언어 전환 링크용) */
export const getSlugsByLang = (): Record<Lang, string[]> =>
  Object.fromEntries(LANGS.map((l) => [l, loadAll()[l].map((p) => p.slug)])) as Record<Lang, string[]>;

/** prev = 더 오래된 글, next = 더 최신 글 */
export const getAdjacentPosts = (lang: Lang, slug: string) => {
  const posts = getAllPosts(lang);
  const i = posts.findIndex((p) => p.slug === slug);
  return { prev: posts[i + 1], next: i > 0 ? posts[i - 1] : undefined };
};

export type TagCount = { name: string; count: number };

export const getAllTags = (lang: Lang): TagCount[] => {
  const counts = new Map<string, number>();
  for (const p of getAllPosts(lang)) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

export const getPostsByTag = (lang: Lang, tag: string) => getAllPosts(lang).filter((p) => p.tags.includes(tag));

/** 검색용 평문. 코드블록·마크다운 문법을 걷어낸다. */
export const toPlainText = (body: string) =>
  body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^[#>\-*+\s]+|[`*_~|]/gm, "")
    .replace(/\s+/g, " ")
    .trim();
