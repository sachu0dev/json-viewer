// Recent JSONPath expressions — small text list, localStorage is enough
// (same reasoning as lib/saved-schemas.ts). Most-recent-first, deduped.

const STORAGE_KEY = "devure-json:jsonpath-history";
const MAX_HISTORY = 20;

export function listQueryHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordQuery(expression: string): string[] {
  if (typeof window === "undefined") return [];
  const trimmed = expression.trim();
  if (!trimmed) return listQueryHistory();
  let next = [trimmed, ...listQueryHistory().filter((q) => q !== trimmed)].slice(0, MAX_HISTORY);
  // Quota-safe: on a full origin quota, drop the oldest queries one at a
  // time and retry rather than throwing out of a keystroke handler.
  for (;;) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    } catch {
      if (next.length <= 1) return next;
      next = next.slice(0, -1);
    }
  }
}

export function clearQueryHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
