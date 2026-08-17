"use client";

import { useEffect, useState } from "react";
import { JsonPathPlayground } from "@/components/JsonPathPlayground";
import { decodeLegacyGzipFragment, decodeShareFragment } from "@/lib/share";
import { ThemeProvider } from "@/hooks/useTheme";

function JsonPathPageInner() {
  const [initialJson, setInitialJson] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const hash = window.location.hash;
    // `#z=` is the current (deflate-raw) format; `#d=` is the older gzip
    // one, still decoded so links shared before the switch keep working.
    const decode = hash.startsWith("#z=")
      ? decodeShareFragment
      : hash.startsWith("#d=")
        ? decodeLegacyGzipFragment
        : null;
    if (!decode) return;
    decode(hash.slice(3))
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
