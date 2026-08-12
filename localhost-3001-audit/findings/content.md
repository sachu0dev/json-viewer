# Content Quality — JSON Viewer

## E-E-A-T / thin content — re-audit
- `/json-diff` and `/large-files` still carry specific, accurate intro paragraphs — unchanged, still good.
- **Homepage previously had zero body content.** Now has a `sr-only` `<h1>` and a `SoftwareApplication` JSON-LD block describing the tool. The *visible* UI is still just the editor shell (no visible paragraph copy) — this is a deliberate product decision (full-screen tool, not a landing page), not an oversight. Crawlers now have real content to read (H1 + schema description); human visitors still get the empty-state hint text ("Paste JSON (⌘V) or drop a file to inspect it") that was already there.
- No blog/docs — still fine for a 3-page utility site, unchanged from last audit.

## Duplicate content
- Still none.

## Findings — re-audit

### High
None — resolved. Thin-content root cause (no H1, no structured data) fixed on the homepage.

### Low
- No authorship/about signals — unchanged, still low priority for a browser utility tool.

## Score: 85/100
