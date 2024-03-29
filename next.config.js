/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    domains: ["firebasestorage.googleapis.com", "velog.velcdn.com"],
  },
  transpilePackages: ["@acme/ui", "lodash-es"],
};

module.exports = nextConfig;
