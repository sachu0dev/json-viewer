import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            // 'unsafe-eval' is required: lib/json-parser.ts evaluates pasted
            // JS-object-literal JSON via `new Function()` as a tolerant-parse fallback.
            // The googletagmanager/google-analytics hosts are for the GA4 tag in
            // app/layout.tsx — GA loads its script from googletagmanager, beacons
            // to google-analytics/analytics.google.com, and falls back to an image
            // pixel, so it needs script-src, connect-src, and img-src entries.
            // Drop these three if the GA tag is ever removed.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com",
              "font-src 'self' data:",
              "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
              "worker-src 'self' blob:",
            ].join("; ") + ";",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
