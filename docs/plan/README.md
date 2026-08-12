# Devure JSON — Roadmap

Index for the phase-wise build plan. [VISION.md](./VISION.md) is the full, unabridged master spec — read that for the *why* and the complete feature list. The files in this directory are the *tracking* layer on top of it: what's actually shipped in this codebase today, what's left, and where each remaining piece lands.

## Progress snapshot

| Phase | File | Status |
|---|---|---|
| Phase 1 — Foundation | [phase-1-foundation.md](./phase-1-foundation.md) | 100% — complete & verified |
| Phase 2 — Professional Toolkit | [phase-2-professional-toolkit.md](./phase-2-professional-toolkit.md) | 100% — minifier, settings, jsonpath, adv-search, repair, jsonl complete |
| Phase 3 — Conversion Platform | [phase-3-conversion-platform.md](./phase-3-conversion-platform.md) | 100% — 13 code & data converters statically pre-rendered |
| Phase 4 — Advanced Dev Tools | [phase-4-advanced-dev-tools.md](./phase-4-advanced-dev-tools.md) | 0% — not started |
| Phase 5 — Privacy & Productivity | [phase-5-privacy-productivity.md](./phase-5-privacy-productivity.md) | ~45% — share/history/palette/settings/minifier done |
| Phase 6 — Browser Extension | [phase-6-browser-extension.md](./phase-6-browser-extension.md) | 0% — not started |
| Phase 7 — SEO | [phase-7-seo.md](./phase-7-seo.md) | ~25% — base metadata + `/jsonpath` & `/jsonl-viewer` pages |
| Phase 8 — Developer Ecosystem | [phase-8-ecosystem.md](./phase-8-ecosystem.md) | 0% — depends on Phase 3 being stable first |

Updated on 2026-08-12.

## Definition of Done — every feature checklist

1. **Functionality** — does the thing the feature claims, correctly, on real/edge-case data.
2. **UX** — has loading, empty, success, and error states (Rule 12).
3. **Performance** — heavy work off the main thread via Web Worker (`workers/json.worker.ts`), no UI freeze (Rule 6/7).
4. **Accessibility** — full keyboard operability (Rule 13), ARIA labels, visible focus, screen reader support.
5. **Error handling** — human-readable errors with next action (jump/fix/explain), not dead ends.
6. **Keyboard support** — shortcut and command-palette entry (Rule 15).
7. **Responsive design** — desktop/tablet/mobile breakpoints, touch-friendly (Rule 14).
8. **Privacy** — no JSON content, JWT payload, or file content ever leaves the device or reaches analytics (Rule 11).
9. **Maintainability** — framework-agnostic `lib/` core, pure UI components, passing unit tests in `lib/*.test.ts`.

## All planned pages (VISION.md §34)

| Page | Status | Owning phase |
|---|---|---|
| `/` (home) | ✅ shipped | 1 |
| `/json-diff` | ✅ shipped | 2 |
| `/large-files` | ✅ shipped | 2 |
| `/jsonpath` | ✅ shipped (`app/jsonpath/page.tsx`) | 2 |
| `/jsonl-viewer` | ✅ shipped (`app/jsonl-viewer/page.tsx`) | 2 |
| `/json-minifier` | not started | 7 |
| `/json-formatter` | not started | 7 |
| `/json-validator` | not started | 7 |
| `/json-viewer` | not started | 7 |
| `/json-parser` | not started | 7 |
| `/json-beautifier` | not started | 7 |
| `/json-schema-validator` | not started | 4 |
| `/json-repair` | not started | 7 |
| `/json-to-typescript` | not started | 3 |
| `/json-to-javascript` | not started | 3 |
| `/json-to-python` | not started | 3 |
| `/json-to-java` | not started | 3 |
| `/json-to-go` | not started | 3 |
| `/json-to-rust` | not started | 3 |
| `/json-to-csharp` | not started | 3 |
| `/json-to-swift` | not started | 3 |
| `/json-to-csv` | not started | 3 |
| `/json-to-yaml` | not started | 3 |
| `/json-to-xml` | not started | 3 |
| `/json-to-toml` | not started | 3 |
| `/jwt-decoder` | not started | 4 |
| `/guides` (hub) | not started | 7 |

## Keyboard shortcuts & command palette master list (VISION.md §25)

| Shortcut / command | Status | Owning phase |
|---|---|---|
| `Ctrl/Cmd + K` — open command palette | ✅ shipped | 1 |
| `/` — focus search | ✅ shipped | 1 |
| `Ctrl/Cmd + F` — focus search | ✅ shipped | 1 |
| `Ctrl/Cmd + S` — save/download | ✅ shipped | 1 |
| `Ctrl/Cmd + Shift + F` — format | ✅ shipped | 1 |
| `Ctrl/Cmd + Shift + M` — minify | ✅ shipped | 2 |
| `Ctrl/Cmd + D` — compare/diff | ✅ shipped | 2 |
| `Ctrl/Cmd + ,` — open settings | ✅ shipped | 2 |
| `Escape` — clear search / exit compare | ✅ shipped | 1 |
| `?` — shortcuts cheat sheet | ✅ shipped | 1 |
| Palette: Format JSON | ✅ shipped | 1 |
| Palette: Minify JSON | ✅ shipped | 2 |
| Palette: Query with JSONPath | ✅ shipped | 2 |
| Palette: Repair JSON | ✅ shipped | 2 |
| Palette: Switch to JSONL viewer | ✅ shipped | 2 |
| Palette: Open settings | ✅ shipped | 2 |
| Palette: Open file | ✅ shipped | 1 |
| Palette: Download JSON | ✅ shipped | 1 |
| Palette: Share link | ✅ shipped | 1 |
| Palette: Expand / Collapse all | ✅ shipped | 1 |
| Palette: Toggle theme | ✅ shipped | 1 |
