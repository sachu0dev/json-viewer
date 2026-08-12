/**
 * lib/settings.ts
 *
 * Single persistence layer for all user preferences.
 * Every setting lives under the "devure-json:settings" localStorage key
 * so "Clear local data" has one place to wipe.
 *
 * PRIVACY: no JSON content, paths, or user data ever stored here — only
 * display/behaviour prefs (Rule 11, §19).
 */

import type { FormatOptions } from "./json-document";

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface AppSettings {
  // Appearance
  themeId: string;

  // Formatting (mirrors FormatOptions so both the popover and settings share values)
  formatIndent: 2 | 4 | 0 | "tab";         // 0 = compact (no indent), "tab" = tabs
  formatSortKeys: boolean;
  formatTrailingNewline: boolean;

  // Editor
  editorFontSize: 12 | 13 | 14 | 16;
  editorWordWrap: boolean;
  editorLineHeight: 1.4 | 1.6 | 1.8;

  // Privacy
  historyEnabled: boolean;

  // Performance
  workerEnabled: boolean;
}

const DEFAULTS: AppSettings = {
  themeId: "dark",
  formatIndent: 2,
  formatSortKeys: false,
  formatTrailingNewline: false,
  editorFontSize: 13,
  editorWordWrap: false,
  editorLineHeight: 1.6,
  historyEnabled: true,
  workerEnabled: true,
};

const STORAGE_KEY = "devure-json:settings";

// ─── Read / write ─────────────────────────────────────────────────────────────

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Quota exceeded — silently skip
  }
}

export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): AppSettings {
  const current = loadSettings();
  const next = { ...current, [key]: value };
  saveSettings(next);
  return next;
}

/**
 * Clear ALL devure-json:* keys from localStorage.
 * Called by the "Clear local data" button in Privacy settings.
 */
export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("devure-json:")) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Derive FormatOptions from settings so the two stay in sync.
 */
export function settingsToFormatOptions(s: AppSettings): Partial<FormatOptions> {
  return {
    indent: s.formatIndent as FormatOptions["indent"],
    sortKeys: s.formatSortKeys,
    trailingNewline: s.formatTrailingNewline,
  };
}
