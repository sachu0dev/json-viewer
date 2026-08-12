"use client";

import { useEffect, useState } from "react";
import { ConverterPlayground } from "@/components/ConverterPlayground";
import { decodeShareFragment } from "@/lib/share";

interface Props {
  slug: string;
}

export function ConverterClientPage({ slug }: Props) {
  const [initialText, setInitialText] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      try {
        const decoded = await decodeShareFragment(hash);
        if (decoded) setInitialText(decoded);
      } catch {
        // Hash decode failed, fallback to default sample
      }
    }
    loadHash();
  }, []);

  return <ConverterPlayground slug={slug} initialHashText={initialText} />;
}
