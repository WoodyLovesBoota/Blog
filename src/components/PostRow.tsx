import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDotDate, formatMonthDay, postHref } from "@/lib/format";
import type { Lang } from "@/lib/i18n";

type Props = {
  post: Pick<PostMeta, "slug" | "title" | "tags" | "date">;
  lang: Lang;
  /** "short" = 11.21 (연도별 목록), "full" = 2026.11.21 */
  dateFormat?: "short" | "full";
  /** 태그 페이지에서는 현재 태그를 우선 노출 */
  primaryTag?: string;
};

export function PostRow({ post, lang, dateFormat = "short", primaryTag }: Props) {
  const tag = primaryTag && post.tags.includes(primaryTag) ? primaryTag : post.tags[0];
  return (
    <Link href={postHref(post.slug, lang)} className="post-row">
      <span className="post-row__title">{post.title}</span>
      <span className="post-row__meta">
        {tag && <span className="post-row__tag">{tag}</span>}
        <time className="post-row__date" dateTime={post.date}>
          {dateFormat === "short" ? formatMonthDay(post.date) : formatDotDate(post.date)}
        </time>
      </span>
    </Link>
  );
}
