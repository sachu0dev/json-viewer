"use client";

import { useEffect, useState } from "react";
import { JsonPathPlayground } from "@/components/JsonPathPlayground";
import { decodeShareFragment } from "@/lib/share";
import { ThemeProvider } from "@/hooks/useTheme";

function JsonPathPageInner() {
  const [initialJson, setInitialJson] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    decodeShareFragment(hash)
      .then((decoded) => {
        if (active && decoded) setInitialJson(decoded);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Remounts (via key) once a shared-hash JSON payload decodes, since
  // JsonPathPlayground only reads initialJson on mount. Rendering
  // immediately (instead of gating on a "ready" flag) is what lets this
  // page SSR real content — search/AI crawlers were previously seeing a
  // bare "Loading…" shell with zero indexable text.
  return <JsonPathPlayground key={initialJson ?? "default"} initialJson={initialJson} />;
}

export function JsonPathPageClient() {
  return (
    <ThemeProvider>
      <JsonPathPageInner />
    </ThemeProvider>
  );
}
