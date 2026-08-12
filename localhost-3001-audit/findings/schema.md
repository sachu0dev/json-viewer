# Schema / Structured Data — JSON Viewer

## Current implementation — re-audit
Each of the 3 pages now injects its own `SoftwareApplication` JSON-LD block, moved out of the root layout into each page component:

- `/` → `name: "JSON Viewer"`, generic tool description.
- `/json-diff` → `name: "JSON Diff Tool"`, diff-specific description (matches the page's own meta description).
- `/large-files` → `name: "Large JSON File Viewer"`, large-file-specific description.

Confirmed via `curl` that all 3 render distinct, valid JSON-LD — no more shared/duplicated block.

## Findings — re-audit

### Medium
None — resolved. Each page now has schema specific to itself.

### Low
- Still no `BreadcrumbList` despite there being 3 distinct sections — minor, not blocking.
- No `FAQPage` schema — still no FAQ content to mark up, no action needed unless FAQ copy is added later.

## Score: 90/100
