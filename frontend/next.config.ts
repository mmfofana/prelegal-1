import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  // Dev proxy: routes /api/* to the local backend (port 8001).
  // Skipped during `next build` (static export ignores rewrites).
  ...(isDev && {
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8001/api/:path*",
        },
      ];
    },
  }),
};

export default nextConfig;
