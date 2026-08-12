# Performance — JSON Viewer

Measured against the Turbopack **dev** server (no production build available in this session) — treat as directional only, not a substitute for a prod Lighthouse run.

## Observed
- TTFB `/`: ~24ms, 17.6KB initial HTML.
- Parsing/diffing work is explicitly offloaded to a Web Worker (`workers/json.worker.ts`) rather than the main thread — confirmed in source, this is the right architecture for the "large files" use case and should keep INP low even under heavy paste/diff operations.
- Large-file rendering only renders visible rows (per `/large-files` page copy and `buildFlatRows` windowing logic in `lib/json-document.ts`) rather than the full tree — correct approach for CLS/INP at scale.

## Findings — re-audit

### Medium
- **Still open — no production build measured.** Not addressed in this pass (out of scope for the SEO metadata/security fixes just made). Dev-server timings (~24ms TTFB, re-confirmed) are still not representative of real LCP/INP/CLS. Recommend running `npm run build && npm run start` and re-measuring with Lighthouse/CrUX.
- Google fonts (`Geist`, `Geist_Mono`) loaded via `next/font/google` — unchanged, still a pass.
- New: added a `Content-Security-Policy` header (`next.config.ts`) — verified it doesn't break the app (Web Worker still loads under `worker-src 'self' blob:'`, editor still evaluates JS-object JSON under the necessary `'unsafe-eval'`). No perf regression expected; headers are static, not render-blocking.

## Score: 75/100 (unchanged — provisional until a prod build is measured)
