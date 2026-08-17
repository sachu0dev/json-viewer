"use client";

import { useEffect, useState } from "react";
import { ConverterPlayground } from "@/components/ConverterPlayground";
import { decodeLegacyGzipFragment, decodeShareFragment } from "@/lib/share";

import { ThemeProvider } from "@/hooks/useTheme";

interface Props {
  slug: string;
}

export function ConverterClientPage({ slug }: Props) {
  const [initialText, setInitialText] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      // `#z=` is the current (deflate-raw) format; `#d=` is the older gzip
      // one, still decoded so links shared before the switch keep working.
      const decode = hash.startsWith("#z=")
        ? decodeShareFragment
        : hash.startsWith("#d=")
          ? decodeLegacyGzipFragment
          : null;
      if (!decode) return;
      try {
        const decoded = await decode(hash.slice(3));
        if (decoded) setInitialText(decoded);
      } catch {
        // Hash decode failed, fallback to default sample
      }
    }
    loadHash();
  }, []);

  return (
    <ThemeProvider>
      {/* Remounts (via key) once a shared-hash JSON payload decodes, since
          ConverterPlayground only reads initialHashText on mount — see the
          same pattern in app/jsonpath/client.tsx. */}
      <ConverterPlayground key={initialText ?? "default"} slug={slug} initialHashText={initialText} />
    </ThemeProvider>
  );
}
