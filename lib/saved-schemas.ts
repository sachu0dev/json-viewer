// Named, locally-saved JSON Schemas for the schema validator tool. Small
// text blobs with a name — localStorage is plenty, no need for
// lib/recent-files.ts's IndexedDB (that store exists because whole JSON
// documents can be large; schemas here are what a person hand-writes).
//
// PRIVACY: stays local, same guarantee as lib/settings.ts (Rule 11, §19).

import { writeWithQuotaFallback } from "./local-storage-safe";

export interface SavedSchema {
  id: string;
  name: string;
  schemaText: string;
  savedAt: number;
}

const STORAGE_KEY = "devure-json:saved-schemas";
const MAX_SAVED = 50;
// 2MB budget — generous for hand-written schemas, conservative enough to
// leave room for the app's other localStorage keys under a shared 5-10MB
// origin quota.
const MAX_BYTES = 2 * 1024 * 1024;

function readAll(): SavedSchema[] {
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

function writeAll(schemas: SavedSchema[]): SavedSchema[] {
  if (typeof window === "undefined") return schemas;
  return writeWithQuotaFallback(STORAGE_KEY, schemas.slice(0, MAX_SAVED), (s) => s.savedAt, MAX_BYTES);
}

export function listSavedSchemas(): SavedSchema[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveSchema(name: string, schemaText: string): SavedSchema {
  const all = readAll();
  const entry: SavedSchema = {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled schema",
    schemaText,
    savedAt: Date.now(),
  };
  // Newest first, then let writeAll enforce the count + byte caps (evicting
  // the oldest entries first) — the entry just saved is never the one cut.
  writeAll([entry, ...all]);
  return entry;
}

export function deleteSchema(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
