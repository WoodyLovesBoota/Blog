import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 영어가 /en 아래 있던 시절의 링크를 접두사 없는 새 주소로 보낸다
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },
  experimental: {
    // 루트 레이아웃이 언어별로 둘이라 매칭되지 않는 URL 의 404 는 app/global-not-found.tsx 가 맡는다
    globalNotFound: true,
  },
};

export default nextConfig;
