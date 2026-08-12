"use client";

import { useCallback, useEffect, useState } from "react";
import { clearRecent, deleteRecentOne, listRecent, saveRecent, type RecentFile } from "@/lib/recent-files";

export function useRecentFiles() {
  const [recent, setRecent] = useState<RecentFile[]>([]);

  const refresh = useCallback(() => {
    listRecent().then(setRecent);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const record = useCallback(
    async (text: string) => {
      try {
        await saveRecent(text);
        refresh();
      } catch {
        // Local history is a convenience, not the document itself — a full
        // IndexedDB quota or a private-mode browser shouldn't interrupt the
        // paste/load flow that triggered this.
      }
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    try {
      await clearRecent();
    } finally {
      refresh();
    }
  }, [refresh]);

  const removeOne = useCallback(
    async (id: string) => {
      try {
        await deleteRecentOne(id);
      } finally {
        refresh();
      }
    },
    [refresh],
  );

  return { recent, record, clear, removeOne };
}
