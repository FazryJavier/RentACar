import type { NextConfig } from "next";

/**
 * Laravel API origin, used only on the server (rewrites and SSR).
 * The browser always talks to this Next.js origin, so Sanctum cookies stay same-origin.
 */
const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${backendUrl}/sanctum/:path*` },
      { source: "/docs/:path*", destination: `${backendUrl}/docs/:path*` },
      { source: "/storage/:path*", destination: `${backendUrl}/storage/:path*` },
    ];
  },
};

export default nextConfig;
