# Phase 1 — Foundation

Source: [VISION.md](./VISION.md) §46 Phase 1, §2 (Core Editor), §3 (Tree Viewer), §26 (Theming)

**Status: 100% shipped.** All Phase 1 foundation features shipped and verified.

## Shipped Features

- [x] **Core editor** — raw / tree / split / preview modes — `components/ViewerApp.tsx`, `components/JsonEditorArea.tsx`
- [x] **Parser** — worker-backed, streaming-friendly — `lib/json-parser.ts`, `workers/json.worker.ts`
- [x] **Auto-format on load** — `components/ViewerApp.tsx` (`tryAutoFormat`)
- [x] **Validator** (parse errors surfaced with line/col) — `lib/json-document.ts`, `hooks/useJsonDocument.ts`
- [x] **Tree viewer** — expand/collapse, values, copy path per node — `components/JsonTree.tsx`
- [x] **Search** (query, matches, jump-to-match, regex, case-sensitive, find & replace) — `components/SearchBar.tsx`, `hooks/useJsonDocument.ts`
- [x] **File upload / drag-drop** — `components/JsonEditorArea.tsx`, `components/ViewerApp.tsx`
- [x] **Dark / light / system themes** + 10 theme presets — `lib/themes.ts`
- [x] **Keyboard shortcuts + command palette** — `components/CommandPalette.tsx`, `components/ShortcutsModal.tsx`
- [x] **Recent files** (local history) — `hooks/useRecentFiles.ts`, `lib/recent-files.ts`
- [x] **Preview mode** (§2.3) — read-only clean presentation view. Shipped 2026-08-12.
- [x] **Formatter controls** (§6) — indentation choice (2/4/tabs), sort keys, trailing newline popover. Shipped 2026-08-12.
- [x] **Find & replace** (§2.2) — replace-one and replace-all with keyboard accessibility. Shipped 2026-08-12.
- [x] **Regex search toggle** (§2.2, §15) — regex search with error handling. Shipped 2026-08-12.
- [x] **Bracket matching / auto-close brackets** (§2.2) — bracket pair matching, auto-closing brackets, jump-to-line (`Ctrl+G`). Shipped 2026-08-12.
- [x] **Keyboard shortcuts complete** (§25) — `Ctrl+S` (save/download), `Ctrl+F` (focus search), `Ctrl+Shift+F` (format), `Escape` (clear/close), `Ctrl+D` (compare), `Ctrl+Shift+M` (minify), `Ctrl+,` (settings), `?` (shortcuts cheat sheet). Shipped 2026-08-12.
