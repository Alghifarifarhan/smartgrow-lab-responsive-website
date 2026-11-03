import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/index.html",
        destination: "/",
      },
      {
        source: "/login.html",
        destination: "/login",
      },
      {
        source: "/admin.html",
        destination: "/admin",
      },
      {
        source: "/news-detail.html",
        destination: "/news-detail",
      },
    ];
  },
};

export default nextConfig;
