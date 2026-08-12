# Action Plan — JSON Viewer SEO (Re-Audit)

Health score: 87/100 (up from 61/100). Everything fixable from source code is done. 2 items remain.

## Remaining
- [ ] **Verify `NEXT_PUBLIC_SITE_URL` is set in production.** Canonical tags, sitemap entries, and OG URLs all resolve off this env var (`app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`). Code is correct; this can only be confirmed by checking the actual deployment config, not from a local dev session.
- [ ] **Run a production build and measure real Core Web Vitals.** `npm run build && npm run start`, then Lighthouse/CrUX. All current numbers are Turbopack dev-server estimates.

## Backlog (low priority, unchanged from last audit)
- [ ] Add favicon size variants (16/32/180/192/512) and a `manifest.json`.

## Done this round
- [x] Homepage `<h1>` + schema
- [x] Per-page OG/Twitter metadata on `/json-diff`, `/large-files`
- [x] Per-page JSON-LD (replaced single shared block)
- [x] Internal nav linking all 3 pages
- [x] Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS)
- [x] Open Graph image
- [x] Title template centralized
