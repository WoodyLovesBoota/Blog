import { localePath, type Lang } from "./i18n";

const parts = (iso: string) => iso.split("-");

/** 11.21 */
export const formatMonthDay = (iso: string) => {
  const [, m, d] = parts(iso);
  return `${m}.${d}`;
};

/** 2026.11.21 */
export const formatDotDate = (iso: string) => iso.replaceAll("-", ".");

/** Nov 21, 2026 */
export const formatLongDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const tagHref = (tag: string, lang: Lang) => localePath(lang, `/tags/${encodeURIComponent(tag)}`);
export const postHref = (slug: string, lang: Lang) => localePath(lang, `/posts/${slug}`);
