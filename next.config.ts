import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows building to a separate folder (e.g. NEXT_DIST_DIR=.next-build) while a dev server uses .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

