// Local-first "recent files": IndexedDB only, never touches a server, no
// account. This is the one place local persistence lives — keep it that way.
//
// ponytail: no automated test here — exercising this needs a fake IndexedDB
// (there's no browser storage in Node's test runner without one), and adding
// a dependency just for this one file isn't worth it yet. Covered instead by
// browser verification each time this file changes; add fake-indexeddb if a
// real regression ever slips through.

export interface RecentFile {
  id: string;
  name: string;
  text: string;
  savedAt: number;
}

const DB_NAME = "json-viewer";
const STORE = "recent";
const MAX_RECENT = 20;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function deriveName(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return "Untitled";
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

function getAll(store: IDBObjectStore): Promise<RecentFile[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as RecentFile[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecent(text: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const existing = await getAll(store);

  // Dedupe by exact content, then re-add at the top with a fresh timestamp.
  const withoutDuplicate = existing.filter((entry) => entry.text !== text);
  for (const entry of existing) {
    if (entry.text === text) store.delete(entry.id);
  }

  store.put({
    id: crypto.randomUUID(),
    name: deriveName(text),
    text,
    savedAt: Date.now(),
  } satisfies RecentFile);

  withoutDuplicate
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(MAX_RECENT - 1)
    .forEach((stale) => store.delete(stale.id));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listRecent(): Promise<RecentFile[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const all = await getAll(tx.objectStore(STORE));
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function clearRecent(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
