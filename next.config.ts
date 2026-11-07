import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Blocks clickjacking; a full CSP would need hashes for the inline theme and JSON-LD scripts.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Files in public/ are served with max-age=0 by default, so every repeat visit re-checks the 3D assets.
      // The Draco decoder is vendored and only changes with a library upgrade: cache it for a year.
      { source: "/draco/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // Models, the 3D font and the fallback still keep their names when they change: fresh for a day, then served from
      // cache while the browser re-checks in the background, so an updated model shows up by the next visit at the latest.
      ...["/models/:file*", "/fonts/:file*", "/fallback.webp"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=2592000" }],
      })),
    ];
  },
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
};

export default nextConfig;
