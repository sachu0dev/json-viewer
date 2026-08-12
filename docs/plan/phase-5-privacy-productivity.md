# Phase 5 — Privacy & Productivity

Source: [VISION.md](./VISION.md) §46 Phase 5, §19 (Local-First Privacy), §20 (PWA/Offline), §21 (History), §22 (Favorites), §23 (Shareable Documents), §25 (Command Palette)

**Status: ~35% shipped.** Several items the doc lists here were actually built early, during Phase-1-era work — tracked under [phase-1](./phase-1-foundation.md) instead so this file only tracks what's genuinely outstanding.

## Already shipped (tracked in Phase 1, noted here for cross-reference)

- [x] Command palette + keyboard shortcuts (§25) — see [phase-1-foundation.md](./phase-1-foundation.md)
- [x] Shareable links — client-side compression (deflate-raw) + legacy gzip fragment support, no server storage of content (§23) — `lib/share.ts`
- [x] Local-first privacy posture — worker-based processing, no JSON content in analytics events (§19) — `workers/json.worker.ts`, `lib/analytics.ts`
- [x] Basic local history (recent files) — `hooks/useRecentFiles.ts`

## Remaining work

- [ ] **PWA / offline mode** (§20) — installable, offline shell, offline parse/format/validate/convert.
  - Placement: site-wide (manifest + service worker apply to every route, not one page); an "Install" affordance surfaced in the header/footer chrome shared across pages.
  - Deliverable checklist (DoD): passes an installability check (manifest with icons/name/theme-color, service worker registered); core tool (parse/format/validate — and whatever converters exist by the time this ships) works with network fully disconnected; offline state is communicated to the user (not a silent failure if a page that needs network, like a guide article, is hit offline).
  - Needs a manifest + service worker; check `next.config.ts` for an existing PWA plugin before adding one (Rule 8).

- [ ] **History UX polish** (§21) — Today/Yesterday/Older grouping, explicit "disable history" and "clear local data" controls.
  - Placement: the existing recent-files UI surface (wherever `useRecentFiles` currently renders its list — check `ViewerApp.tsx`), plus the disable/clear controls live in the Phase-2 settings panel's Privacy section (Rule 3: one settings surface, not a second one here).
  - Deliverable checklist (DoD): grouped headers exactly as §21 shows (Recent / Today / Yesterday / Older); restore and delete-one both work already per `useRecentFiles.ts` — verify, don't assume; "Clear all" and "Disable history" are both one click away, and disabling actually stops new entries from being recorded (not just hiding the list).

- [ ] **Favorites / saved workspaces** (§22) — save JSON documents, JSONPath queries, schemas, formatting preferences locally.
  - Placement: a "Favorites" or "Saved" panel alongside the recent-files list (same area, different tab/section — these are conceptually siblings, don't scatter them across the UI).
  - Deliverable checklist (DoD): saving a JSON document works standalone today; saving a JSONPath query only becomes meaningful once [phase-2](./phase-2-professional-toolkit.md)'s JSONPath tool ships, saving a schema once [phase-4](./phase-4-advanced-dev-tools.md)'s schema tool ships — ship the document-saving part now, add the other save-targets incrementally as their source features land, rather than blocking this whole item on both.
  - Everything stored locally only, per §22 ("Everything should remain local unless cloud storage is explicitly introduced later") — no server persistence without a deliberate, separate decision.

- [ ] **Share link hardening** (§23) — expiration, password protection *if* server storage is ever introduced, delete-shared-document.
  - Current implementation is URL-fragment-only (no server storage), so expiration/password/delete don't apply yet — only relevant if the product later adds a server-backed share option. Don't build ahead of that decision (YAGNI) — no placement/DoD to define until that decision is made.

- [ ] **Privacy indicator + dedicated privacy page** (§19) — visible "🔒 Processing locally" indicator in the UI, and a `/privacy` page explaining the architecture.
  - Placement: indicator lives in the persistent header/toolbar chrome (visible on every tool page, not just the homepage); `/privacy` is a standalone route linked from that indicator and from the footer.
  - Deliverable checklist (DoD): indicator only claims "processing locally" on pages where that's actually true today (verify against every shipped feature — worker-based parsing is local, but confirm analytics calls in `lib/analytics.ts` truly never include content before claiming full local-only processing); `/privacy` page explains the architecture in the same terms as §19's diagram (User JSON → Browser → Web Worker → Result, explicitly not → Server), and lists exactly what analytics does and doesn't record, matching the real event list in `lib/analytics.ts`, not an aspirational one.
  - Small, high-value, no dependencies — good candidate to do early in this phase.

- [ ] **Keyboard/command-palette integration (Rule 15):** "Open settings" is explicitly in the doc's §25 palette command list — add it once the Phase-2 settings panel exists. Add "Toggle theme" too if not already in the palette (check `components/CommandPalette.tsx` — theme switching exists via `useTheme`, confirm it's exposed as a palette command, not just a UI toggle). Favorites/saved workspaces gets a palette entry once it ships (e.g. "Save workspace").

## Notes

- Don't re-plan the already-shipped command palette / share / recent-files items — they're done. This file's checklist is the *actual* remaining Phase-5 scope.
