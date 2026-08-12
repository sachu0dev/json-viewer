# On-Page SEO — JSON Viewer

## Per-page audit — re-audit

| Route | Title | Meta description | H1 | og:title/desc |
|---|---|---|---|---|
| `/` | "JSON Viewer — Paste, Diff, and Inspect JSON in Your Browser" (60 chars, good) | 173 chars, on-topic | `sr-only` — present, added | correct |
| `/json-diff` | "JSON Diff Tool — Compare Two JSON Files Online \| JSON Viewer" (via template) | 173 chars, specific | "Compare two JSON files" | **fixed — own title/description** |
| `/large-files` | "View Large JSON Files Without Crashing Your Browser \| JSON Viewer" (via template) | 179 chars, specific | "View large JSON files without freezing the tab" | **fixed — own title/description** |

## Findings — re-audit

### High
None — both resolved.
- Homepage now has an `<h1>` (`app/page.tsx`, `sr-only` since the visual UI is the editor shell itself, not a marketing page) plus its own `SoftwareApplication` schema.
- `/json-diff` and `/large-files` now each set their own `openGraph`/`twitter` blocks — confirmed via `curl` that `og:title`/`og:description` match the page, not the homepage.

### Medium
- **Fixed.** Title template in `app/layout.tsx` changed to `"%s | JSON Viewer"`; subpages no longer hardcode the suffix themselves.

### Low
- Homepage H1 is visually hidden (`sr-only`). Deliberate tradeoff — the homepage's actual UI is a full-screen editor with no room for a visible heading without disrupting the layout — but it means the H1 helps crawlers/AI engines/screen readers, not sighted visitors. Acceptable for a single-purpose tool.

## Score: 95/100
