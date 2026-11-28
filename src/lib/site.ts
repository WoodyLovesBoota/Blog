/**
 * 배포 도메인. canonical·OG·sitemap·RSS 절대 URL이 전부 이 값을 쓴다.
 * 1) NEXT_PUBLIC_SITE_URL  2) Vercel이 빌드 때 넣어주는 프로덕션 도메인  3) 로컬 개발용 localhost
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

/** 사이트 전역 설정. */
export const site = {
  name: "woody.dev",
  url: resolveSiteUrl(),
  author: {
    name: "Taewook Yang",
    github: "https://github.com/woodylovesboota",
    portfolio: "https://woodylovesboota.xyz",
  },
} as const;

export const absoluteUrl = (path = "/") => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
