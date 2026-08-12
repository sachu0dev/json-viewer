# Phase 7 — SEO

Source: [VISION.md](./VISION.md) §46 Phase 7, §34 (SEO Site Structure), §35 (SEO Content Hub), §36 (Homepage), §40 (Product Metrics → SEO)

**Status: ~15% shipped.** Base metadata plumbing exists; almost none of the dedicated landing-page structure does. This phase runs in parallel with Phases 2–4, not strictly after them — each tool page ships its SEO page alongside the feature, not as a separate backfill pass.

## Already shipped

- [x] `robots.ts` / `sitemap.ts` — app/robots.ts, app/sitemap.ts (sitemap currently only lists `/`, `/json-diff`, `/large-files` — grows as pages are added, see below)
- [x] Base metadata (`title`, `description`, OpenGraph) in root layout — `app/layout.tsx`
- [x] Dynamic OG image — `app/opengraph-image.tsx`
- [x] GA4 tracking wired (`G-FSD6QCXQDR`) — `app/layout.tsx`, CSP allowlist in `next.config.ts`
- [x] Theme-reactive favicon — `lib/favicon.ts` (per recent commit `4390cbe`)
- [x] Prior SEO audit on file — `audits/json.devure.in-audit/` (Google SEO report + raw audit data — read before redoing any audit work, don't duplicate it)

## Page architecture pattern — dedicated pages, not one page wearing many hats

User's explicit concern: cramming every feature onto one page is bad for SEO (thin/duplicate content — Google can't tell what the page is *for*) and bad UX (a visitor searching "json to typescript" wants that tool front-and-center, not a 12-button toolbar). Each dedicated page must actually be dedicated: the one relevant tool, working standalone, plus links out to the rest of the site.

**Current gap, found by reading the code (not assumed):** `components/ToolPage.tsx` is the shared shell already used by `/json-diff` and `/large-files`. It mounts the *entire* `ViewerAppContent` (`components/ViewerApp.tsx`, 724 lines — full editor, tree, search, diff, command palette, everything) on every page, and only swaps the H1/intro text (`ToolPage.tsx:8-29`). So today, every "dedicated" page is actually the same all-features app with different marketing copy on top — not a single-purpose tool page. This is the wrong pattern to copy 20+ more times for the Phase-3 converter pages.

- [ ] **Fix the template before scaling it** — this blocks all 24 pages in the table below, so do it first, not after a few pages are already built the old way:
  1. Extract single-feature views out of `ViewerApp.tsx` (e.g. a converter page needs an input editor + output panel + the one converter's options — not the diff UI, not the full command palette surface). This is the same decomposition [phase-1](./phase-1-foundation.md)'s notes already flag `ViewerApp.tsx` for (724 lines, Rule 4: no giant components) — doing it here serves both goals at once.
  2. Build a site-wide tool cross-link component (e.g. `components/ToolsIndex.tsx`) that lists every page from this README's page table, and mount it on every dedicated page (footer or sidebar) — this is the "full link to other tools" the user asked for. One shared component, not hand-copied links per page (Rule 3).
  3. Keep the current full-featured, everything-in-one-view experience at `/` — that's fine to stay feature-dense since the homepage isn't competing for a narrow search query. The lean single-purpose treatment is specifically for the dedicated SEO pages in the table below.
  4. Migrate `/json-diff` and `/large-files` to the new pattern too while doing this — they're already using the old one and would otherwise be inconsistent with every page built after them.

## Remaining work

- [ ] **Dedicated landing pages** (§34) — one per tool: `/json-formatter`, `/json-validator`, `/json-viewer`, `/json-parser`, `/json-beautifier`, `/json-minifier`, `/json-diff` (exists, needs SEO content added), `/jsonpath`, `/json-schema-validator`, `/json-repair`, `/json-to-typescript`, `/json-to-javascript`, `/json-to-python`, `/json-to-java`, `/json-to-go`, `/json-to-rust`, `/json-to-csharp`, `/json-to-swift`, `/json-to-csv`, `/json-to-yaml`, `/json-to-xml`, `/json-to-toml`, `/jwt-decoder`, `/jsonl-viewer`. **Sequence this against the actual feature — a converter landing page only makes sense once that converter exists (Phase 3/4).** Don't create SEO shells for features that don't work yet ("Never claim conversion support if edge cases are not handled correctly" — §13).
  - **Commitment: every page in this list gets built — none are dropped.** Sequencing by feature-readiness (a converter's landing page waits for that converter) is about order, not scope; track each as a row in [README.md](./README.md)'s page checklist so none get silently forgotten once the list gets long.
  - Each page needs: unique title, unique meta description, unique H1, explanation copy, the actual tool UI, examples, FAQ, internal links, canonical, OG metadata, structured data.
  - Each page's FAQ/docs section should surface the relevant keyboard shortcuts for that tool (e.g. the `/json-formatter` page mentions `Ctrl/Cmd + Shift + F`) — reuses the same shortcut list being built out per-phase, not a separate SEO-only list.
  - Deliverable checklist (DoD): every page clears the standard [README.md](./README.md) Definition-of-Done in addition to the SEO-specific list above — an SEO page that isn't keyboard-accessible or breaks on mobile is a bad SEO page even before Google sees it (Core Web Vitals and mobile-friendliness are ranking factors, not just nice-to-haves — §45).
  - See "Page architecture pattern" above for the shared shell each of these pages must use (`ToolPage.tsx` needs to change shape first — it currently mounts the entire app rather than a single feature).
- [ ] **Structured data** (§34) — no JSON-LD found in `app/layout.tsx` currently. Add `SoftwareApplication` schema (doc cites Google's own docs for this) at minimum on the homepage, then per-tool pages once they exist.
- [ ] **Sitemap growth** — `app/sitemap.ts` needs an entry per landing page as each ships; keep it in sync rather than batching at the end.
- [ ] **`/guides` content hub** (§35) — "How to format JSON", "JSON vs YAML", "How to convert JSON to TypeScript", etc. Doc's explicit constraint: "Do not mass-produce generic AI articles. Every article should solve a real developer problem and link naturally to the relevant tool." Only write a guide once its linked tool exists.
- [ ] **Homepage rework** (§36) — current homepage is the tool itself (`app/page.tsx`, 30 lines, delegates to `ViewerApp`). Doc wants a fuller structure below the tool: features, use cases, privacy, large-file capability, converters, shortcuts, FAQ. Decide how much marketing scaffolding is worth adding above the tool without burying it — doc itself warns (§37) against "fake SaaS dashboards" and wants the tool to dominate.

## Notes

- **Known open item from prior SEO work (unresolved, still worth checking):** verify `NEXT_PUBLIC_SITE_URL=https://json.devure.in` is actually set in the Vercel production environment — `robots.ts`/`sitemap.ts`/`layout.tsx` all fall back to `localhost:3000` if it's unset, which would silently break canonical URLs in production.
- **Known duplicate, unresolved:** `hooks/useTheme.ts` and `hooks/useTheme.tsx` are byte-identical — not SEO, but clean up when touching theme code in this phase's homepage work.
- Favicon size variants + `manifest.json`, and a production Lighthouse pass, are both still open from earlier SEO audits — fold into this phase rather than tracking separately.
- **§40 Product Metrics** is an ongoing measurement practice, not a build task: once GA4 (already wired) and Search Console are both reporting real traffic, periodically check acquisition/activation/engagement/retention/SEO numbers per §40's breakdown — indexed pages, queries, impressions, CTR, average position via Search Console's URL Inspection, per the doc's own citation. No code ships for this; it's a recurring check against what Phases 1–7 already produce.
