/** 사이트 전역 설정. 도메인은 NEXT_PUBLIC_SITE_URL 로 주입한다. */
export const site = {
  name: "woody.dev",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  author: {
    name: "Taewook Yang",
    github: "https://github.com/woodylovesboota",
  },
} as const;

export const absoluteUrl = (path = "/") => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
