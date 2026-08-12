# Phase 6 — Browser Extension

Source: [VISION.md](./VISION.md) §46 Phase 6, §33 (Browser Extension)

**Status: 0% shipped.** Not started — correctly sequenced last among the near-term phases since it's a separate deployable (own repo or own top-level directory, own review/publish cycle via Chrome Web Store), not a change to this Next.js app.

## Remaining work

- [ ] **Decide repo layout** before writing any extension code: separate repo vs. `extension/` directory in this repo sharing core conversion/format/validate logic. If Phase 3's converter logic and the existing `lib/json-parser.ts`/`lib/json-document.ts` are framework-agnostic (they already are — no React import in those files), the extension can import them directly. Confirm this before starting rather than assuming it (Rule 2).

- [ ] **Manifest V3 scaffold** — background service worker, minimal permissions.
  - Deliverable checklist (DoD): manifest requests only what each shipped feature below actually needs (§33: "Request the minimum permissions possible") — no blanket `<all_urls>` grab up front; passes Chrome Web Store review's permission-justification requirements.

- [ ] **Right-click → "Open selected JSON in Devure"**
  - Placement: context menu entry registered via `contextMenus` API, active when selected text looks like JSON.
  - Deliverable checklist (DoD): opens the main site (or extension popup) with the selected text pre-loaded — reuses the same share/hand-off mechanism as cross-page state transfer elsewhere in the plan (`lib/share.ts`'s pattern), not a new transport; selection that isn't valid JSON still opens the tool with an error state, not a silent failure.

- [ ] **Raw JSON page detection** → "Open in Devure JSON" prompt
  - Placement: content script detects `Content-Type: application/json` raw responses (the browser's native JSON viewer pages).
  - Deliverable checklist (DoD): prompt is dismissible and doesn't reappear every visit once dismissed for that origin (respect the user, don't nag); works on the browser's built-in raw-JSON view without breaking it.

- [ ] **Popup quick formatter** — paste → format, no full app needed in the popup.
  - Placement: `popup.html`, minimal UI — textarea in, formatted output out, copy button. Deliberately not the full editor/tree/search surface (Rule 4 applies here too — a popup is not the place for feature density).
  - Deliverable checklist (DoD): works fully offline (no network call to the main site needed for basic formatting); reuses `lib/json-document.ts`'s stringify logic directly rather than reimplementing formatting in the extension.

- [ ] **Privacy-forward Chrome Web Store listing copy** — per doc, privacy should be a major part of the listing.
  - Deliverable checklist (DoD): listing explicitly states what data the extension does and doesn't access/transmit, consistent with the `/privacy` page from [phase-5](./phase-5-privacy-productivity.md) — one privacy story, stated consistently in both places, not two different claims.

## Notes

- Do not start this phase until Phase 3 (converters) has at least JSON→TypeScript shipped and Phase 1/2 core (parse/format/validate) is stable — the extension's value is reusing that logic, not reimplementing it.
