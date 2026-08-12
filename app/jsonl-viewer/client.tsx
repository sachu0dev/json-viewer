"use client";

import { useState } from "react";
import Link from "next/link";
import { parseJsonl, type JsonlSummary } from "@/lib/jsonl-parser";
import { JsonlViewer } from "@/components/JsonlViewer";

const SAMPLE_JSONL = `{"id": 1, "user": "Alice", "status": "active"}
{"id": 2, "user": "Bob", "status": "inactive"}
{"id": 3, "user": "Charlie", status: unquoted}
{"id": 4, "user": "David", "status": "active"}`;

export function JsonlPageClient() {
  const [inputText, setInputText] = useState(SAMPLE_JSONL);
  const [summary, setSummary] = useState<JsonlSummary | null>(() => parseJsonl(SAMPLE_JSONL));
  // Starts pre-filled with a sample (unlike the other tools), so the intro
  // collapses on first focus of the input, not on "has content".
  const [active, setActive] = useState(false);

  function handleProcess() {
    setSummary(parseJsonl(inputText));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d1117", color: "#e6edf3" }}>
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
            JSONL Viewer
          </span>
        </div>
        <nav className="flex items-center gap-4 font-mono text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          <Link href="/jsonpath" className="hover:opacity-80">JSONPath</Link>
          <Link href="/json-diff" className="hover:opacity-80">Diff</Link>
          <Link href="/" className="hover:opacity-80">← Back to viewer</Link>
        </nav>
      </header>

      {/* Hero — collapses once the user starts editing the input, same
          collapse-to-fullscreen behavior every other tool page has. */}
      <div
        className="overflow-hidden border-b transition-[max-height] duration-200 ease-out motion-reduce:transition-none"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          backgroundColor: "#161b22",
          maxHeight: active ? "0px" : "220px",
        }}
      >
        <div className="px-4 py-5">
          <h1 className="text-lg font-semibold">JSONL / NDJSON Viewer & Validator</h1>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Paste newline-delimited JSON — one JSON value per line, the format used by log
            streams, ML training exports, and bulk API dumps — and see every line validated
            independently, with per-line error messages for anything malformed. Filter to
            valid-only or invalid-only, search across raw text, and export either the clean
            subset or everything back out as .jsonl. Virtualized rendering stays smooth even
            past 100,000 records.{" "}
            <span style={{ color: "rgba(255,255,255,0.35)" }}>
              🔒 100% local-first — nothing you paste ever leaves your browser.
            </span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Input pane */}
        <div className="w-full md:w-1/2 flex flex-col border-r p-4 gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between">
            <label htmlFor="jsonl-input" className="text-xs font-semibold uppercase tracking-wider opacity-60">
              Input JSONL / NDJSON
            </label>
            <button
              onClick={handleProcess}
              className="rounded px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#238636", color: "#ffffff" }}
            >
              Process JSONL
            </button>
          </div>
          <textarea
            id="jsonl-input"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setSummary(parseJsonl(e.target.value));
            }}
            onFocus={() => setActive(true)}
            placeholder="Paste JSONL here (one JSON value per line)…"
            className="flex-1 rounded-lg p-3 font-mono text-xs leading-relaxed outline-none resize-none min-h-[300px]"
            style={{
              backgroundColor: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "inherit",
            }}
            spellCheck={false}
          />
        </div>

        {/* Results Viewer pane */}
        <div className="w-full md:w-1/2 flex flex-col min-h-0">
          {summary ? (
            <JsonlViewer summary={summary} />
          ) : (
            <div className="p-8 text-sm opacity-40">Paste JSONL on the left to see results.</div>
          )}
        </div>
      </div>
    </div>
  );
}
