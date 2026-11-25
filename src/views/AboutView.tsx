import type { Metadata } from "next";
import Link from "next/link";
import { tagHref } from "@/lib/format";
import { localePath, t, type Lang } from "@/lib/i18n";
import { getAllTags } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";
import { alternatesFor } from "./seo";

export const aboutMetadata = (lang: Lang): Metadata => ({
  title: t(lang).about,
  description: t(lang).aboutDescription(site.author.name),
  alternates: alternatesFor(lang, "/about"),
});

const copy = {
  ko: {
    intro:
      "프론트엔드 리드. 10만+ 사용자 크립토 캐시백 플랫폼 TetherMax의 웹·모바일 프론트엔드 팀을 이끌고 있습니다. React.js, Next.js, TypeScript, React Native를 주로 쓰고, 그 전에는 스마트 컨트랙트 보안 감사와 블록체인 개발을 했습니다.",
    highlightsTitle: "주요 작업",
    highlights: [
      { text: "모바일 LCP ~6s → ~3s, 페이지당 JS ~2MB → 200–300KB", href: "/posts/nextjs-web-performance" },
      { text: "Vercel 비용 80% 이상 절감", href: "/posts/image-pipeline" },
      { text: "앱 내 화면 로드 2–3s → 0.5s 미만 (WebView 프리로딩)", href: "/posts/webview-prewarm" },
      { text: "로그아웃 상태 둘러보기로 가입 전환율 3배 이상" },
      { text: "외주 코드 인하우스 전환: Next.js(App Router) 40+ 페이지 재구축, iOS·Android 앱 첫 출시" },
    ],
    careerTitle: "경력",
    career: [
      { period: "2026.06 – 현재", what: "Neovate (TetherMax) · Frontend Lead" },
      { period: "2024.01 – 2026.06", what: "Neovate (TetherMax) · Frontend Engineer" },
      { period: "2022.02 – 2023.08", what: "대한민국 육군 · 병역" },
      { period: "2019.10 – 2021.12", what: "HAECHI LABS · 스마트 컨트랙트 보안 감사" },
      { period: "2018.07 – 2019.10", what: "Thymebloc · Founding Engineer" },
    ],
    educationTitle: "학력",
    education: [{ period: "2015.03 – 2021.02", what: "서울대학교 전기·정보공학부 학사" }],
    topics: "주로 다루는 것",
    contact: "연락",
  },
  en: {
    intro:
      "Frontend lead. I lead the web and mobile frontend team at TetherMax, a crypto cashback platform with 100K+ users. I mostly work with React.js, Next.js, TypeScript and React Native; before that I did smart contract security audits and blockchain development.",
    highlightsTitle: "Selected work",
    highlights: [
      { text: "Mobile LCP ~6s → ~3s, per-page JS ~2MB → 200–300KB", href: "/en/posts/nextjs-web-performance" },
      { text: "Vercel bill cut by over 80%", href: "/en/posts/image-pipeline" },
      { text: "In-app screen load 2–3s → under 0.5s (WebView preloading)", href: "/en/posts/webview-prewarm" },
      { text: "Sign-up conversion more than tripled by letting logged-out visitors explore" },
      { text: "Moved the product in-house: rebuilt 40+ pages on Next.js (App Router), shipped the first iOS and Android apps" },
    ],
    careerTitle: "Experience",
    career: [
      { period: "2026.06 – now", what: "Neovate (TetherMax) · Frontend Lead" },
      { period: "2024.01 – 2026.06", what: "Neovate (TetherMax) · Frontend Engineer" },
      { period: "2022.02 – 2023.08", what: "Republic of Korea Army · Military service" },
      { period: "2019.10 – 2021.12", what: "HAECHI LABS · Smart Contract Security Auditor" },
      { period: "2018.07 – 2019.10", what: "Thymebloc · Founding Engineer" },
    ],
    educationTitle: "Education",
    education: [{ period: "2015.03 – 2021.02", what: "Seoul National University · B.S. Electrical and Computer Engineering" }],
    topics: "Topics",
    contact: "Contact",
  },
} satisfies Record<Lang, unknown>;

export function AboutView({ lang }: { lang: Lang }) {
  const c = copy[lang];
  const topTags = getAllTags(lang).slice(0, 8);
  const rss = localePath(lang, "/rss.xml");

  return (
    <main className="container about">
      <section>
        <h1>{site.author.name}</h1>
        <p>{c.intro}</p>
      </section>

      <section>
        <h2>{c.highlightsTitle}</h2>
        <ul className="about-list">
          {c.highlights.map((h) => (
            <li key={h.text}>{"href" in h && h.href ? <Link href={h.href}>{h.text}</Link> : h.text}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{c.careerTitle}</h2>
        <dl>
          {c.career.map((item, i) => (
            <div key={i} style={{ display: "contents" }}>
              <dt>{item.period}</dt>
              <dd>{item.what}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>{c.educationTitle}</h2>
        <dl>
          {c.education.map((item, i) => (
            <div key={i} style={{ display: "contents" }}>
              <dt>{item.period}</dt>
              <dd>{item.what}</dd>
            </div>
          ))}
        </dl>
      </section>

      {topTags.length > 0 && (
        <section>
          <h2>{c.topics}</h2>
          <p className="inline-tags">
            {topTags.map((tag) => (
              <Link key={tag.name} href={tagHref(tag.name, lang)}>{tag.name}</Link>
            ))}
          </p>
        </section>
      )}

      <section>
        <h2>{c.contact}</h2>
        <ul className="contact">
          <li>
            <span>GitHub</span>
            <a href={site.author.github} target="_blank" rel="noopener noreferrer">{site.author.github.replace("https://", "")}</a>
          </li>
          <li>
            <span>LinkedIn</span>
            <a href="https://www.linkedin.com/in/taewook-yang-6762092a2" target="_blank" rel="noopener noreferrer">linkedin.com/in/taewook-yang-6762092a2</a>
          </li>
          <li>
            <span>RSS</span>
            <a href={rss}>{absoluteUrl(rss).replace(/^https?:\/\//, "")}</a>
          </li>
        </ul>
      </section>
    </main>
  );
}
