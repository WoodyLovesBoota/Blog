import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // 루트 레이아웃이 언어별로 둘이라 매칭되지 않는 URL 의 404 는 app/global-not-found.tsx 가 맡는다
    globalNotFound: true,
  },
};

export default nextConfig;
