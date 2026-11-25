import Link from "next/link";
import type { TagCount } from "@/lib/posts";
import { tagHref } from "@/lib/format";
import type { Lang } from "@/lib/i18n";

export function TagCloud({ tags, current, lang }: { tags: TagCount[]; current?: string; lang: Lang }) {
  return (
    <ul className="tag-cloud">
      {tags.map((t) => (
        <li key={t.name}>
          <Link href={tagHref(t.name, lang)} aria-current={t.name === current ? "page" : undefined}>
            <span className="tag-cloud__name">{t.name}</span>
            <span className="tag-cloud__count">{t.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
