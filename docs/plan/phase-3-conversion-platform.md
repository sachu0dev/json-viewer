# Phase 3 — Conversion Platform

Source: [VISION.md](./VISION.md) §46 Phase 3, §11 (JSON → TypeScript), §12 (Code Generators), §13 (Format Converters)

**Status: 0% shipped.** Nothing in this phase exists yet. No converter code, no dependency for any of it in `package.json`.

## Remaining work

- [ ] **JSON → TypeScript** (§11) — flagship feature per the doc; do this first.
  - Placement: dedicated page `/json-to-typescript` (single-purpose, per [phase-7](./phase-7-seo.md)'s template) as the primary surface, plus a "Convert" toolbar action on the main tool that opens the same converter pre-filled with the current document (so a user inspecting an API response never has to re-paste — same cross-page hand-off principle as JSONPath in [phase-2](./phase-2-professional-toolkit.md)).
  - Deliverable checklist (DoD): every §11 control present — interface vs. type, optional properties, nullable properties, naming strategy, root type name, export keyword, `readonly`, nested interface generation, enum inference where possible; output updates live as input changes or options change; copy/download both work; handles mixed-type arrays (union types, not `any`), deeply nested objects, empty arrays/objects, and non-identifier key names (quoted keys) — these are the cases where reference tools visibly fail, see below.
  - Core logic: `lib/converters/json-to-typescript.ts`, pure function (JSON value → string), no framework dependency, tested against real edge-case fixtures in `lib/converters/json-to-typescript.test.ts` before it's considered done.
  - Competitive bar: see [competitive-bar.md](./competitive-bar.md) "JSON → TypeScript / code generators" row — quicktype.io is the reference to beat on inference quality; don't ship something visibly weaker on mixed-type arrays.
  - Write with `superpowers:writing-plans` before starting — this one has the largest edge-case surface in the whole roadmap.

- [ ] **JSON → JavaScript**
  - Placement: `/json-to-javascript` page, same converter UI shell as TypeScript with a language toggle, not a separate page implementation (Rule 3).
  - Deliverable checklist (DoD): reuses the TS converter's shape-inference core, drops type annotations, outputs either a plain object literal or a JSDoc-typed version (decide which — the doc doesn't specify; JSDoc gives more value and reuses the same inferred shape, so default to that unless it complicates the output more than it's worth).

- [ ] **JSON → CSV** (§13) — flatten controls, header handling, nested path notation. Genuinely different problem from the language generators (tabular, not type inference).
  - Placement: `/json-to-csv` page.
  - Deliverable checklist (DoD): §13's exact controls — flatten nested data (on/off), array handling (explode rows vs. join), header row toggle, nested path notation for flattened keys (e.g. `user.address.city`); handles arrays-of-objects with inconsistent keys across items without silently dropping columns; download and copy both work.

- [ ] **JSON ↔ YAML** (§13)
  - Placement: `/json-to-yaml` page (bidirectional — also accepts YAML input and outputs JSON, per the doc's `↔` notation).
  - Deliverable checklist (DoD): round-trips correctly (JSON → YAML → JSON produces the same structure); handles YAML-specific gotchas (multiline strings, anchors/aliases — decide explicit scope: support anchors, or document that they're unsupported rather than silently mishandling them, per §13's "never claim conversion support if edge cases are not handled correctly").
  - Check for a small, zero-dependency approach first; only add a YAML library if hand-rolling the subset needed is unreasonable (Rule 8).

- [ ] **JSON ↔ XML** (§13) — user has explicitly asked for this one.
  - Placement: `/json-to-xml` page, bidirectional like YAML.
  - Deliverable checklist (DoD): attribute vs. element representation is a real design decision for JSON→XML (arrays, in particular, have no single obvious XML shape) — document the chosen convention on the page itself, not just in code; round-trips correctly for that documented convention; handles the common attribute-prefix convention (e.g. `@attr`) if adopted.
  - Same dependency-justification question as YAML (Rule 8) — evaluate a lightweight XML builder/parser vs. hand-rolling before adding a dependency.

- [ ] **JSON → TOML** (§13)
  - Placement: `/json-to-toml` page.
  - Deliverable checklist (DoD): handles TOML's stricter typing (dates, nested tables) without silently coercing; same dependency-justification step as YAML/XML.

- [ ] **Other language generators** (§12) — Python (TypedDict/dataclass/Pydantic), Java, Kotlin, Go (struct + json tags), Rust (struct/serde), C#, Swift, PHP.
  - Placement: one dedicated page per language per the [README.md](./README.md) page table, all sharing the same converter-page UI shell (input, options, live output, copy/download) that TypeScript establishes — a new language should mean a new `lib/converters/json-to-<lang>.ts` file and a new thin page, not a new UI pattern.
  - Deliverable checklist (DoD) per language: reuses the shared shape-inference core (see Notes below); options match §12's per-language example (Python: TypedDict/dataclass/Pydantic mode toggle; Go: struct + json tags; Rust: struct + serde derive); has its own test file with real nested/mixed-type fixtures before being marked shipped.
  - Do these only after TypeScript ships and its converter architecture (options model, naming strategy, type inference) has proven itself — reuse that shape rather than inventing one per language.

- [ ] **Keyboard/command-palette integration (Rule 15, §25):** the doc's palette command list explicitly names "Convert to TypeScript" and "Convert to CSV" — add both as soon as those two converters ship. Add a palette entry for every other converter as it ships (Python, Go, Rust, C#, Kotlin, Swift, PHP, YAML, XML, TOML). No dedicated global keyboard shortcuts are specified for these beyond palette access — don't invent shortcuts the doc doesn't ask for.

## Notes

- **Doc's explicit warning (§13):** "Only add formats when the conversion is reliable. Never claim conversion support if edge cases are not handled correctly." Ship converters one at a time, each with its own test file (`lib/converters/*.test.ts`, following the existing pattern in `lib/json-parser.test.ts`), not as a batch.
- Type-inference logic (union types, optional detection, nested interface extraction) is the hard, reusable core across TS/Python/Go/Rust/etc. Build it once as a shared `lib/converters/infer-shape.ts`-style module rather than duplicating inference per target language (Rule 3: no duplicate functionality).
- No new runtime dependency is needed for TypeScript/JavaScript generation — it's string templating over an inferred shape. Evaluate case-by-case for YAML/XML/TOML before reaching for a library.
