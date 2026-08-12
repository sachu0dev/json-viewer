# JSON Viewer — Handoff Context

This file exists because this project is moving to a machine/session with no
memory of the chat that built it. Read this before touching code.

## What this is

Browser-only JSON viewer/workspace. Next.js 16 (App Router, TypeScript,
Tailwind v4), **no backend, no database, no accounts** — everything runs
client-side. Vision: not another JSON formatter, the workspace developers
instinctively open to inspect/debug/compare/transform JSON — VS Code polish,
Raycast speed, zero install, local-first, privacy-first.

Full product research (10-perspective local council: PM, Founding Engineer,
UX Designer, DevRel, Indie Hacker, SEO Strategist, Performance Engineer, OSS
Maintainer, Technical Writer, Frontend Architect) is saved at
`.claude/council-cache/local-council-1785230372.md` — read that for the *why*
behind every scope decision below.

## Start here

```
./start.sh          # npm install && npm test && npm run dev
```
Or manually: `npm install`, `npm test`, `npm run dev` (http://localhost:3000),
`npm run build` for a production build, `npm run lint`.

`node_modules/` and `.next/` were deleted before zipping this project — that's
normal, `npm install` regenerates them.

## Non-negotiable architecture (do not casually change)

The one thing the whole council agreed was the irreversible decision: **the
parsed JSON document lives only in a Web Worker** (`workers/json.worker.ts`),
never as a raw object on the main thread. The main thread only ever receives
a flat, path-indexed row list (`lib/json-document.ts` → `buildFlatRows`) sized
to what's actually expanded/visible, rendered through a virtualized list
(`@tanstack/react-virtual` in `components/JsonTree.tsx`).

Why: every failed/stalled competitor researched (JSON Crack, JSON Hero, naive
formatter sites) broke on large files because they rendered the whole parsed
object as a DOM tree. Retrofitting lazy/virtualized rendering onto a
"whole-object-in-state" codebase is a rewrite, not a patch — so this was
built correctly from the first commit instead of optimized later.

If you're adding a feature that needs the document's content (not just row
metadata), add a new worker message type and keep the object inside the
worker. Don't `postMessage` the whole parsed doc back to the main thread.

## File map

- `lib/json-document.ts` — pure functions: `buildFlatRows` (tree flattening),
  `searchDocument`, `diffDocuments`, `describeParseError`, `ancestorsOf`.
  Tested in `lib/json-document.test.ts`.
- `lib/share.ts` — URL-fragment encode/decode (gzip + base64url, native
  CompressionStream, no dependency). Tested in `lib/share.test.ts`.
- `lib/recent-files.ts` — IndexedDB wrapper for local "recent files". No
  automated test (would need a fake-IndexedDB dependency) — verify by hand
  in a browser if you touch this file.
- `workers/json.worker.ts` — owns the parsed doc(s), handles parse/toggle/
  search/reveal/compare/stringify messages. This is the only place
  `JSON.parse` should be called on user input.
- `hooks/useJsonDocument.ts` — worker lifecycle + all the request/response
  state (rows, error, search matches, diff entries, stringify).
- `hooks/useRecentFiles.ts` — thin wrapper around `lib/recent-files.ts`.
- `components/ViewerApp.tsx` — the actual tool (toolbar, tree, search, diff,
  command palette, toasts). Mounted by every route that needs the tool.
- `components/{JsonTree,DiffView,SearchBar,CommandPalette,EmptyState}.tsx` —
  presentational pieces `ViewerApp` composes.
- `app/page.tsx` — thin server-component wrapper, mounts `ViewerApp` at `/`.
- `app/json-diff/page.tsx`, `app/large-files/page.tsx` — SEO landing pages,
  each with its own metadata + intro copy, each embedding the real
  `ViewerApp` (not a mockup — the tool actually works on these routes).
- `app/layout.tsx` — global metadata, OpenGraph/Twitter tags, JSON-LD
  (`SoftwareApplication`) structured data.
- `app/sitemap.ts`, `app/robots.ts` — native Next.js metadata routes.

## What's built (verified: tsc clean, lint clean, 11/11 unit tests, browser-tested)

- Paste/drop → Web Worker parse → path-indexed model → virtualized tree
- Keyboard nav (↑↓/Enter), `/` to search, `y` to copy a row's path
- Search: buried-match discovery, jump-to with auto-expand, next/prev
- Friendly parse errors (line/column, not raw V8 output)
- Structural diff between two documents (`Compare…` button)
- Local persistence: recent files via IndexedDB, shown on the empty state
- URL-fragment sharing (`Share` button) — doc is gzip+base64url in `#d=...`,
  never touches a server, verified to round-trip on a cold navigation
- Command palette (⌘K / Ctrl+K): copy formatted/minified JSON, share,
  compare, clear recent files, "Support this project" (see below)
- SEO: per-page metadata, OG/Twitter, JSON-LD, sitemap.xml, robots.txt,
  two landing pages for real workflows (diff, large files)
- MIT `LICENSE`, `CONTRIBUTING.md` with an explicit scope/triage policy

## Known placeholder — fix before shipping publicly

`components/ViewerApp.tsx` has:
```ts
const SUPPORT_URL = "#"; // TODO: replace with real donate link
```
Swap in a real GitHub Sponsors / Ko-fi / Buy Me a Coffee URL. Until then the
"Support this project" command just shows a toast telling you to set it.

## Explicitly rejected by the council (don't add these without re-deciding)

Accounts, cloud sync, collaboration, a built-in HTTP client, a jq-style query
language, JSON Schema validation, a format-conversion zoo (YAML/TOML/XML),
AI features, graph/node visualization as a flagship feature. Every one of
these was raised and cut for a specific reason in the council doc — read it
before re-adding any of them.

## Product-model note

The stated business plan (from the human, not the council): ship free with
full features, build a user base over ~a year, then paywall some existing
features once users depend on the tool. Flagged once during the session: this
is the exact pattern the council's OSS-maintainer research named as what
killed trust in Postman/Insomnia. Not blocked, just documented here so
whoever picks this up next knows it's a deliberate, already-discussed choice.

## Open decisions nobody made yet

- Real domain for `NEXT_PUBLIC_SITE_URL` (metadata/canonical/sitemap all fall
  back to `http://localhost:3000` until this is set)
- `SUPPORT_URL` above
- No `.git` repo initialized yet — this was built without version control in
  the original session; consider `git init` on the new machine before making
  further changes
