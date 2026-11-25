import type { Metadata } from "next";
import { fontClassName } from "@/lib/fonts";
import { dict } from "@/lib/i18n";
import "./globals.css";

// 어떤 라우트에도 맞지 않는 URL 용. 루트 레이아웃이 언어별로 둘이라 레이아웃 없이 렌더링된다.
export const metadata: Metadata = {
  title: "404 · woody.dev",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="ko" className={fontClassName}>
      <body>
        <main className="container page not-found">
          <div>
            <h1>404</h1>
            <p>
              {dict.ko.notFound} <a href="/">{dict.ko.backToList}</a>
            </p>
            <p lang="en">
              {dict.en.notFound} <a href="/en">{dict.en.backToList}</a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
