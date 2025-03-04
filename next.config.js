const nextConfig = {
  experimental: { optimizeCss: true },
  swcMinify: true,
  reactStrictMode: false,
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "velog.velcdn.com",
      "picsum.photos",
    ],
  },
};

module.exports = nextConfig;
