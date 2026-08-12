// Shared quota-safe write for the small localStorage-backed lists in this
// app (saved schemas, JSONPath history — see lib/saved-schemas.ts and
// lib/jsonpath-history.ts). A full origin quota, or Safari private mode's
// blanket throw-on-any-write, must degrade the feature (drop the oldest
// entries and keep going) rather than crash the button that triggered it.

/**
 * Trims `entries` to a byte budget, then writes with `localStorage.setItem`,
 * evicting the oldest (by `getTimestamp`) one at a time on failure until the
 * write succeeds or nothing is left. Returns whatever ended up persisted.
 */
export function writeWithQuotaFallback<T>(
  key: string,
  entries: T[],
  getTimestamp: (entry: T) => number,
  maxBytes: number
): T[] {
  const list = [...entries].sort((a, b) => getTimestamp(b) - getTimestamp(a));

  // Pre-trim to the byte budget so we're not repeatedly provoking the
  // browser's quota error one item at a time on an obviously-oversized list.
  while (list.length > 0 && new Blob([JSON.stringify(list)]).size > maxBytes) {
    list.pop();
  }

  for (;;) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
      return list;
    } catch {
      if (list.length === 0) return list; // storage is unusable even empty — give up quietly
      list.pop();
    }
  }
}
