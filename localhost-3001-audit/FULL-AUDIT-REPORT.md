# Full SEO Audit — JSON Viewer (Re-Audit)

Audited: `http://localhost:3001` (local dev server; port 3000 still occupied by an unrelated project)
Date: 2026-07-29 (re-audit, following remediation of the first report)
Pages crawled: 3 (`/`, `/json-diff`, `/large-files`).

## Executive Summary

**SEO Health Score: 87/100** (up from 61/100)

Business type: developer tool / client-only SaaS utility. Every High and Critical finding from the original audit is resolved. Two items remain open, both outside what's fixable from source code alone:

1. Canonical/sitemap URLs still show `http://localhost:3000` — this is the documented dev-only fallback; needs confirmation that `NEXT_PUBLIC_SITE_URL` is actually set in the real production deployment.
2. No production-build performance measurement — only dev-server timings exist so far.

### What was fixed since the last audit
- Homepage: added `sr-only <h1>` + page-specific `SoftwareApplication` JSON-LD (was: zero heading, zero structured data).
- `/json-diff` and `/large-files`: added page-specific `openGraph`/`twitter` metadata (were inheriting the homepage's) and their own JSON-LD (was one shared block site-wide).
- Added a nav (`Diff`, `Large files`, logo → home) to the always-visible header — all 3 pages now cross-link (previously zero internal links anywhere).
- Added security headers via `next.config.ts`: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`.
- Added an Open Graph image at `/opengraph-image` via Next's built-in `ImageResponse` (was: no OG image, blank social previews).
- Centralized title template to `"%s | JSON Viewer"` (was a bare passthrough relying on subpages to append the suffix manually).
- Verified all of the above with `curl` against the running dev server — see per-category findings files for evidence.

### Still open
- `NEXT_PUBLIC_SITE_URL` — confirm it's set in production.
- Production Lighthouse pass — not done this round.
- Favicon size variants / `manifest.json` — left as low-priority backlog, unchanged.

---

## Technical SEO — 92/100
See `findings/technical.md`. Security headers and internal nav now in place; only the env-var verification remains open.

## Content Quality — 85/100
See `findings/content.md`. Homepage thin-content root cause fixed (H1 + schema); still no visible body paragraph, by design.

## On-Page SEO — 95/100
See `findings/onpage.md`. All High findings resolved.

## Schema & Structured Data — 90/100
See `findings/schema.md`. Per-page schema replacing the single shared block.

## Performance — 75/100 (unchanged, provisional)
See `findings/performance.md`. Not addressed this round — still needs a production Lighthouse pass.

## AI Search Readiness (GEO) — 75/100
See `findings/geo.md`. Homepage now has real signal for AI engines via H1 + schema.

## Images — 80/100
See `findings/images.md`. OG image fixed; favicon variants still backlog.

---

## Scoring Weights Applied

| Category | Weight | Score | Contribution |
|---|---|---|---|
| Technical SEO | 22% | 92 | 20.24 |
| Content Quality | 23% | 85 | 19.55 |
| On-Page SEO | 20% | 95 | 19.0 |
| Schema / Structured Data | 10% | 90 | 9.0 |
| Performance (CWV) | 10% | 75 | 7.5 |
| AI Search Readiness | 10% | 75 | 7.5 |
| Images | 5% | 80 | 4.0 |
| **Total** | | | **86.79 → 87** |

Previous score: 61/100. Delta: **+26**.

See `ACTION-PLAN.md` for the 2 remaining items.
