// Pinned tool shortcuts for the landing page's quick-access row. This is
// about pinning a *service* (a route like /jsonpath), not saving any JSON
// data — small, local, no size-budget concerns like the document/schema
// stores need.

const STORAGE_KEY = "devure-json:pinned-tools";
const MAX_PINNED = 8;

export function listPinnedTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeAll(hrefs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hrefs));
  } catch {
    // Quota exceeded on a tiny string list is effectively impossible, but
    // stay quiet rather than crash a pin-toggle click either way.
  }
}

/** Toggles a tool's pinned state, capped at MAX_PINNED (oldest pin drops first). Returns the new list. */
export function togglePinnedTool(href: string): string[] {
  const current = listPinnedTools();
  const next = current.includes(href)
    ? current.filter((h) => h !== href)
    : [...current, href].slice(-MAX_PINNED);
  writeAll(next);
  return next;
}
