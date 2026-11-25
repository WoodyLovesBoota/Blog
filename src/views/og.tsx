import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { formatLongDate } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import { getPost } from "@/lib/posts";
import { site } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };

// Noto Sans KR 에 라틴 글리프도 들어 있어 두 언어 모두 이 폰트 하나로 그린다
const loadFont = () => readFile(path.join(process.cwd(), "src/assets/NotoSansKR-SemiBold.ttf"));

const Logo = ({ size }: { size: number }) => (
  <div style={{ display: "flex", fontSize: size, letterSpacing: "-0.02em" }}>
    woody<span style={{ color: "#5fd38d" }}>.</span>dev
  </div>
);

export async function siteOgImage(lang: Lang) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, padding: 80, background: "#0e1013", color: "#f2f4f7", fontFamily: "Noto Sans KR" }}>
        <Logo size={88} />
        <div style={{ display: "flex", fontSize: 34, color: "#8a919c" }}>{t(lang).siteDescription}</div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Noto Sans KR", data: await loadFont(), weight: 600, style: "normal" }] },
  );
}

export async function postOgImage(lang: Lang, slug: string) {
  const post = getPost(lang, slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#0e1013", color: "#f2f4f7", fontFamily: "Noto Sans KR" }}>
        <Logo size={32} />
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.3, letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
          {post?.title ?? site.name}
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 28, color: "#8a919c" }}>
          {post && <span>{formatLongDate(post.date)}</span>}
          {post?.tags.slice(0, 4).map((tag) => <span key={tag} style={{ color: "#5fd38d" }}>{tag}</span>)}
        </div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Noto Sans KR", data: await loadFont(), weight: 600, style: "normal" }] },
  );
}
