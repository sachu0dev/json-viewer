"use client";

import { useCallback, useEffect, useState } from "react";
import { clearRecent, listRecent, saveRecent, type RecentFile } from "@/lib/recent-files";

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
      await saveRecent(text);
      refresh();
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    await clearRecent();
    refresh();
  }, [refresh]);

  return { recent, record, clear };
}
