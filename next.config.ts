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
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            // lib/json-parser.ts used to need 'unsafe-eval' for its
            // tolerant-parse fallback (new Function() on pasted text) — it's
            // now a hand-rolled parser instead, so no eval grant is needed.
            // The googletagmanager/google-analytics hosts are for the GA4 tag in
            // app/layout.tsx — GA loads its script from googletagmanager, beacons
            // to google-analytics/analytics.google.com, and falls back to an image
            // pixel, so it needs script-src, connect-src, and img-src entries.
            // Drop these three if the GA tag is ever removed.
            // style-src still needs 'unsafe-inline': the theme system sets
            // colors via per-element `style={{...}}` throughout the app, and
            // CSP has no nonce mechanism for inline style *attributes* (only
            // for <style> blocks) — removing it would need a full rewrite of
            // theming to CSS custom properties, out of scope here.
            // 'unsafe-eval' is re-added ONLY in `next dev` — React's dev-mode
            // tooling (not React itself, and never in production; see its own
            // console message) wants it for reconstructing stack traces across
            // Turbopack's HMR boundaries. Real users only ever get the build
            // below, which never includes it.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval' " : ""}https://www.googletagmanager.com https://va.vercel-scripts.com`,
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
