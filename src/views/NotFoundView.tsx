import Link from "next/link";
import { localePath, t, type Lang } from "@/lib/i18n";

export function NotFoundView({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <main className="container page not-found">
      <div>
        <h1>404</h1>
        <p>
          {d.notFound} <Link href={localePath(lang, "/")}>{d.backToList}</Link>
        </p>
      </div>
    </main>
  );
}
