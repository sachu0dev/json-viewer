# Technical SEO — JSON Viewer

Scope: 3 routes (`/`, `/json-diff`, `/large-files`), Next.js app, no CMS/backend, client-only tooling.

## What works
- `robots.txt` present, valid syntax, allows all crawling.
- `sitemap.xml` generated dynamically (`app/sitemap.ts`), lists all 3 routes with `lastModified`.
- Clean URL structure, no query-string or trailing-slash duplication.
- Fast TTFB in dev (~24ms for `/`); no obvious render-blocking chain server-side.
- No 4xx/5xx on any of the 3 declared routes.

## Findings — re-audit

### Critical
None.

### High
None — resolved.

### Medium
- **Fixed.** Security headers now sent site-wide via `next.config.ts` `headers()`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, and a `Content-Security-Policy`. CSP intentionally allows `script-src 'unsafe-eval'` — required because `lib/json-parser.ts` evaluates pasted JS-object-literal JSON via `new Function()` as a tolerant-parse fallback; documented inline with a comment.
- **Fixed.** Nav links (`Diff`, `Large files`, logo → `/`) added to the always-visible header bar in `components/ViewerApp.tsx`. Confirmed present in the rendered HTML of all 3 pages. All 3 pages now cross-link.

### Low
- Still open: no `public/` directory, no favicon size variants beyond `app/favicon.ico`, no `manifest.json`. Left as-is — low priority, no action taken this pass.

### Still needs verification (not fixable from this environment)
- **Canonical + sitemap URLs still resolve to `http://localhost:3000`.** This is the documented dev-only fallback in `app/layout.tsx`/`app/robots.ts`/`app/sitemap.ts` when `NEXT_PUBLIC_SITE_URL` is unset — code is correct, but there is no way to confirm from a local dev session whether the env var is actually set in the real production deployment. Treat as an open deployment-config check, not a code defect.

## Score: 92/100 (100 once the prod env var is confirmed set)
