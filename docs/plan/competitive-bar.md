# Competitive bar

Written from general knowledge of the current JSON-tooling landscape, not a live audit — treat as the bar to clear, re-verify specifics (pricing, exact feature names) before making public comparison claims. The point isn't to copy any one of these; it's that today a developer needs 4-5 different tabs open to do what Devure should do in one place, each of those tools doing one thing well and everything else badly or not at all. Devure's edge is having all of it, done to the standard of the best individual point-solution, in one privacy-first, fast, local-first surface — not a watered-down aggregation.

Each row: what the strongest point-solution in that category does well → what Devure must do to actually beat it, not just match it.

## Format / Validate / Beautify

**Reference bar:** jsonformatter.org, jsonlint.com, freeformatter.com, codebeautify.org — fast formatting, decent error messages, but ad-heavy, no large-file handling, no worker offloading (large paste = frozen tab), weak/no keyboard UX, no command palette, no privacy story (most send data to a server to "format").
**Devure must:** do all of it 100% client-side (already true — §19), stay responsive on files these tools choke on (already true via `workers/json.worker.ts` — [phase-2](./phase-2-professional-toolkit.md)), and be usable entirely from the keyboard (currently the weak point — see the shortcut table in [README.md](./README.md)).

## Tree / Viewer

**Reference bar:** jsonhero.io (excellent inferred-type tree, clean nav, schema-aware column view), jsoncrack.com (visual node-graph rendering — genuinely different mental model, good for understanding deeply nested structures at a glance), jsoneditoronline.org (dual editor+tree, in-place editing).
**Devure must:** match jsonhero's tree quality (already close — `components/JsonTree.tsx`) and jsoneditoronline's in-place edit/add/delete/rename (§3 lists these; verify actual coverage in `JsonTree.tsx` against §3's full action list — copy path, duplicate node, move node, drag-and-drop are the ones most likely still missing). A jsoncrack-style graph view is a legitimate future differentiator beyond the current doc scope — not planned in any phase yet; flag as a candidate addition to Phase 2 or 4 if tree-only navigation proves insufficient for deeply nested real-world API responses.

## Diff

**Reference bar:** jsondiff.com, json-diff.com — functional tree diffs, but flat presentation (hard to scan on a real 200-key API response diff), no filtering by change type, no keyboard navigation between changes.
**Devure must:** the filter set §8 specifies (All/Added/Removed/Changed/Unchanged) plus next/previous-change keyboard navigation — this is where Devure's existing side-by-side view (`components/SideBySideDiff.tsx`) can outright beat the reference bar rather than just match it, since none of the common tools do side-by-side *and* filtered *and* keyboard-navigable together.

## JSON → TypeScript / code generators

**Reference bar:** quicktype.io is the gold standard here — multi-language (TS, Go, Rust, Python, Swift, C#, Kotlin, and more), solid type inference across arrays of mixed shapes, union type detection, CLI + web + library. transform.tools and json2ts.com cover TS only, more basic inference.
**Devure must:** this is the highest bar in the whole spec. Section 11/12's control list (interface vs type, optional/nullable, naming strategy, root name, export keyword, readonly, nested interfaces, enum inference) is table-stakes against quicktype, not a differentiator. The actual differentiator per [phase-3](./phase-3-conversion-platform.md)'s notes is having this live in the *same* surface as the tree/diff/schema tools — a developer inspecting an API response can go paste → validate → view tree → generate types without leaving the tab, which quicktype (separate tool) doesn't offer. Don't ship a TS converter that's weaker than quicktype's inference on mixed-type arrays; that's the one place "good enough" visibly loses to the reference.

## JSONPath

**Reference bar:** jsonpath.com — simple query box + result list, no execution time shown, no path-format options.
**Devure must:** §9's requirements (result count, paths, values, execution time, example query library) already exceed this reference bar on paper. Low competitive risk — just build it to spec.

## JSON Schema

**Reference bar:** jsonschemavalidator.net — validates against a schema and shows an error list, but errors are terse ("data.foo should be string") not human-explained.
**Devure must:** apply the same human-readable error philosophy as §29's JSON-error-UX pattern to schema validation errors too (§10's example — `/users/0/email`, Expected: string, Received: number — already implies this). This is a case where Devure's existing error-UX bar (already applied to parse errors) just needs to extend to a new validator, not be invented from scratch.

## JWT decoder

**Reference bar:** jwt.io is the reference implementation developers already trust and default to — decode + signature verify (client-side, with a provided secret/key) + claim explanations.
**Devure must:** match the decode/claims/expiry UX exactly (§14 covers this), but jwt.io's signature verification (optional secret input) is *not* in Devure's spec — the doc explicitly scopes this to decode-only with a clear "does not verify signature" disclaimer. Don't silently add verification later without deciding this is an intentional scope change from the spec.

## CSV / YAML / XML / TOML converters

**Reference bar:** scattered, single-format tools (csvjson.com, json-csv.com, various "json to xml" one-offs) — mostly fine on simple flat objects, unreliable on deeply nested or array-heavy input, which is exactly when developers actually need the tool.
**Devure must:** §13's explicit warning is the whole competitive story here — "Never claim conversion support if edge cases are not handled correctly." Ship each format with real nested/array edge-case test coverage (`lib/converters/*.test.ts`) before it's listed as supported; a converter that silently mangles nested arrays is worse than no converter, and is exactly where the low-effort reference tools already fail.

## Large files

**Reference bar:** almost every point-solution above either hard-caps input size or freezes the tab well before 10MB, because none of them are built worker-first.
**Devure must:** this is already a real, shipped differentiator (`app/large-files/page.tsx`, virtualized via `@tanstack/react-virtual`) — no competitor bar to catch up to here, just keep it working as new features (repair, JSONPath, converters) get added on top, since each of those needs to route through the same worker rather than reintroducing a main-thread bottleneck for large input.
