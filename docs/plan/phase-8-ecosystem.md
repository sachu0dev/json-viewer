# Phase 8 — Developer Ecosystem

Source: [VISION.md](./VISION.md) §46 Phase 8, §42 (Core Engine Independence)

**Status: 0% shipped.** Last phase — depends on nearly everything before it being stable.

## Remaining work

- [ ] **Extract core engine as standalone packages** (§42) — `@devure/json-core`, `@devure/json-format`, `@devure/json-diff`, `@devure/json-converters`. Only do this once `lib/json-parser.ts`, `lib/json-document.ts`, and the Phase-3 converters have proven stable and are already framework-agnostic (they currently have no React imports — good sign this split will be mechanical, not a rewrite).
- [ ] **`devure-json` CLI** — thin wrapper over the extracted core packages once they exist. Don't build this before the packages exist; there'd be nothing stable to wrap.
- [ ] **Developer API** — only if there's an actual server-side surface by this point (there isn't one today — this app is entirely client-side/local-first per §19). Revisit scope when this phase starts; don't pre-design an API for a backend that doesn't exist yet (YAGNI).
- [ ] **GitHub presence / docs site** — public-facing developer docs for the extracted packages.

## Notes

- This phase is intentionally light on placement/DoD detail — it's far enough out that locking in package boundaries now would be guessing, and the [README.md](./README.md) Definition-of-Done/[competitive-bar.md](./competitive-bar.md) framework built for phases 1–7 doesn't map cleanly onto "ship an npm package." Write the real plan for this phase for whichever core module gets extracted first (`superpowers:writing-plans`), when Phase 3 is actually done and the shape of `lib/converters/*` is known — that plan should define its own DoD (versioning, changelog, published types) at that point.
