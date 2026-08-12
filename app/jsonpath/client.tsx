"use client";

import { useEffect, useState } from "react";
import { JsonPathPlayground } from "@/components/JsonPathPlayground";
import { decodeShareFragment } from "@/lib/share";
import { ThemeProvider } from "@/hooks/useTheme";

function JsonPathPageInner() {
  const [initialJson, setInitialJson] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const hash = window.location.hash.slice(1);
    if (hash) {
      decodeShareFragment(hash)
        .then((decoded) => {
          if (active && decoded) setInitialJson(decoded);
        })
        .catch(() => {});
    }
    const t = setTimeout(() => {
      if (active) setReady(true);
    }, 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, []);

  if (!ready) {
    return <div className="p-8 text-sm opacity-40">Loading…</div>;
  }

  return <JsonPathPlayground initialJson={initialJson} />;
}

export function JsonPathPageClient() {
  return (
    <ThemeProvider>
      <JsonPathPageInner />
    </ThemeProvider>
  );
}
