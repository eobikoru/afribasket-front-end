import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://afribasket-backend-1.onrender.com/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
