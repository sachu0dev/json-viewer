"use client";

import { useEffect, useState } from "react";
import { JsonPathPlayground } from "@/components/JsonPathPlayground";
import Link from "next/link";
import { decodeShareFragment } from "@/lib/share";

export function JsonPathPageClient() {
  const [initialJson, setInitialJson] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  // Read hash on client-side — may contain JSON from "Open in JSONPath" button
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      (async () => {
        try {
          const decoded = await decodeShareFragment(hash);
          if (decoded) setInitialJson(decoded);
        } catch {
          // Ignore malformed hash — start blank
        }
      })();
    }
    setReady(true);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d1117", color: "#e6edf3" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "#161b22" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-xs font-bold tracking-wider uppercase hover:opacity-80"
            style={{ color: "#58a6ff" }}
          >
            JSON Viewer
          </Link>
          <span className="text-xs opacity-40">/</span>
          <span className="font-mono text-xs font-semibold" style={{ color: "#e6edf3" }}>
            JSONPath
          </span>
        </div>
        <nav className="flex items-center gap-4 font-mono text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          <Link href="/json-diff" className="hover:opacity-80">Diff</Link>
          <Link href="/large-files" className="hover:opacity-80">Large files</Link>
          <Link href="/" className="hover:opacity-80">← Back to viewer</Link>
        </nav>
      </header>

      {/* Hero */}
      <div className="border-b px-4 py-5" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#161b22" }}>
        <h1 className="text-lg font-semibold">JSONPath Tester</h1>
        <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Query your JSON with JSONPath expressions. Results update as you type.{" "}
          <span style={{ color: "rgba(255,255,255,0.35)" }}>🔒 Nothing leaves your browser.</span>
        </p>
        {initialJson && (
          <div
            className="mt-2 inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs"
            style={{ backgroundColor: "rgba(88,166,255,0.15)", color: "#58a6ff", border: "1px solid rgba(88,166,255,0.3)" }}
          >
            ✓ JSON loaded from viewer
          </div>
        )}
      </div>

      {/* Playground */}
      {ready ? (
        <JsonPathPlayground initialJson={initialJson} />
      ) : (
        <div className="p-8 text-sm opacity-40">Loading…</div>
      )}

      {/* Reference */}
      <section className="border-t px-4 py-6 mt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <h2 className="mb-3 text-sm font-semibold opacity-60 uppercase tracking-wider">JSONPath Quick Reference</h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 text-xs font-mono">
          {[
            ["$", "Root element"],
            ["$.name", "Field 'name' on root"],
            ["$.users[0]", "First item in 'users' array"],
            ["$.users[*]", "All items in 'users' array"],
            ["$..email", "All 'email' fields anywhere"],
            ["$.store.book[?(@.price < 10)]", "Books with price < 10"],
            ["$.users[0:3]", "Array slice, items 0–2"],
            ["$.users[-1]", "Last item in array"],
            ["$.users[*].name", "All names in users array"],
            ["$..*", "All values recursively"],
          ].map(([expr, desc]) => (
            <div
              key={expr}
              className="rounded p-2"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div style={{ color: "#79c0ff" }}>{expr}</div>
              <div className="mt-0.5 font-sans text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
