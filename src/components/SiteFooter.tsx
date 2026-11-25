import { localePath, t, type Lang } from "@/lib/i18n";
import { site } from "@/lib/site";

export function SiteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="container">
      <div className="site-footer">
        <span>© {new Date().getFullYear()} {site.author.name}</span>
        <nav aria-label={t(lang).externalLinks}>
          <a href={site.author.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={localePath(lang, "/rss.xml")}>RSS</a>
        </nav>
      </div>
    </footer>
  );
}
