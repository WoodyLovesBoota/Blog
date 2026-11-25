import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fontClassName } from "@/lib/fonts";
import { htmlLang, localePath, ogLocale, t, type Lang } from "@/lib/i18n";
import { getSlugsByLang } from "@/lib/posts";
import { site } from "@/lib/site";
import { alternatesFor } from "./seo";

export const rootMetadata = (lang: Lang): Metadata => {
  const d = t(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: `%s · ${site.name}` },
    description: d.siteDescription,
    applicationName: site.name,
    authors: [{ name: site.author.name, url: site.author.github }],
    creator: site.author.name,
    alternates: {
      ...alternatesFor(lang, "/"),
      types: { "application/rss+xml": [{ url: localePath(lang, "/rss.xml"), title: `${site.name} RSS` }] },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: ogLocale[lang],
      url: localePath(lang, "/"),
      title: site.name,
      description: d.siteDescription,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
};

export const rootViewport: Viewport = {
  themeColor: "#0e1013",
  colorScheme: "dark",
};

/** 언어별 루트 레이아웃이 공유하는 <html> 골격 */
export function RootDocument({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={htmlLang[lang]} className={fontClassName}>
      <body>
        <SiteHeader lang={lang} slugs={getSlugsByLang()} />
        {children}
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
