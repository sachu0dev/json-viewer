"use client";

import { useEffect, useRef, useState } from "react";
import { EXAMPLE_QUERIES, executeJsonPath, type JsonPathQueryResult } from "@/lib/jsonpath";
import { parseTolerantJSON } from "@/lib/json-parser";
import type { JsonValue } from "@/lib/json-document";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(v: JsonValue): string {
  if (v === null) return "null";
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80) + (JSON.stringify(v).length > 80 ? "…" : "");
  return String(v);
}

function formatValueType(v: JsonValue): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Pre-populated JSON from URL hash — undefined if standalone page */
  initialJson?: string;
}

export function JsonPathPlayground({ initialJson }: Props) {
  const [jsonText, setJsonText] = useState(initialJson ?? "");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<JsonValue | null>(null);

  const [expression, setExpression] = useState("$.*");
  const [queryResult, setQueryResult] = useState<JsonPathQueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const queryInputRef = useRef<HTMLInputElement>(null);

  // Parse JSON whenever text changes
  useEffect(() => {
    if (!jsonText.trim()) {
      setParsedDoc(null);
      setJsonError(null);
      setQueryResult(null);
      return;
    }
    try {
      const result = parseTolerantJSON(jsonText);
      setParsedDoc(result.value);
      setJsonError(null);
    } catch {
      setParsedDoc(null);
      setJsonError("Invalid JSON — fix the input before querying.");
    }
  }, [jsonText]);

  // Re-run query when expression or doc changes
  useEffect(() => {
    if (!parsedDoc || !expression.trim()) { setQueryResult(null); return; }
    setIsRunning(true);
    // Tiny timeout to let React render the loading state
    const t = setTimeout(() => {
      const result = executeJsonPath(parsedDoc, expression);
      setQueryResult(result);
      setIsRunning(false);
    }, 0);
    return () => clearTimeout(t);
  }, [parsedDoc, expression]);

  const resultCount = queryResult?.results.length ?? 0;
  const cappedAt500 = resultCount === 500;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl mx-auto">

      {/* ── Section 1: JSON input ── */}
      <section>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider opacity-60">
          JSON Input
        </label>
        <div className="relative">
          <textarea
            id="jsonpath-json-input"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={"Paste your JSON here…\n\n{\"users\": [{\"name\": \"Alice\", \"age\": 30}]}"}
            className="w-full rounded-lg p-3 font-mono text-sm leading-relaxed outline-none resize-y min-h-[140px]"
            style={{
              backgroundColor: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "inherit",
            }}
            spellCheck={false}
          />
          {jsonText && (
            <span
              className="absolute bottom-2 right-3 text-[10px] font-mono opacity-40"
            >
              {jsonText.length.toLocaleString()} chars
            </span>
          )}
        </div>
        {jsonError && (
          <p className="mt-1 text-xs text-red-400">{jsonError}</p>
        )}
        {parsedDoc && !jsonError && (
          <p className="mt-1 text-xs opacity-50">✓ Valid JSON parsed</p>
        )}
      </section>

      {/* ── Section 2: Query input ── */}
      <section>
        <label htmlFor="jsonpath-query-input" className="mb-1 block text-xs font-semibold uppercase tracking-wider opacity-60">
          JSONPath Expression
        </label>
        <div className="flex gap-2">
          <input
            id="jsonpath-query-input"
            ref={queryInputRef}
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="$.users[*].email"
            className="flex-1 rounded-lg px-3 py-2 font-mono text-sm outline-none"
            style={{
              backgroundColor: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "inherit",
            }}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* Example queries */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q.query}
              onClick={() => setExpression(q.query)}
              className="rounded px-2 py-0.5 font-mono text-[11px] transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "inherit",
              }}
              title={q.label}
            >
              {q.query}
            </button>
          ))}
        </div>
      </section>

      {/* ── Section 3: Results ── */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider opacity-60">
            Results
          </label>
          {queryResult && !queryResult.error && (
            <span className="text-xs opacity-50 font-mono">
              {resultCount} match{resultCount !== 1 ? "es" : ""}{cappedAt500 ? " (capped at 500)" : ""} · {queryResult.executionMs}ms
            </span>
          )}
        </div>

        {/* States */}
        {!jsonText.trim() && (
          <div className="rounded-lg p-6 text-center text-sm opacity-40" style={{ border: "1px dashed rgba(255,255,255,0.15)" }}>
            Paste JSON above to start querying
          </div>
        )}

        {jsonText.trim() && jsonError && (
          <div className="rounded-lg p-4 text-sm text-red-400" style={{ border: "1px solid rgba(192,57,43,0.4)", backgroundColor: "rgba(192,57,43,0.1)" }}>
            Fix the JSON input before querying.
          </div>
        )}

        {queryResult?.error && (
          <div className="rounded-lg p-4 text-sm text-red-400" style={{ border: "1px solid rgba(192,57,43,0.4)", backgroundColor: "rgba(192,57,43,0.1)" }}>
            <span className="font-semibold">Expression error: </span>{queryResult.error}
          </div>
        )}

        {isRunning && (
          <div className="rounded-lg p-4 text-sm opacity-50">Evaluating…</div>
        )}

        {queryResult && !queryResult.error && !isRunning && resultCount === 0 && (
          <div className="rounded-lg p-6 text-center text-sm opacity-40" style={{ border: "1px dashed rgba(255,255,255,0.15)" }}>
            No matches
          </div>
        )}

        {queryResult && !queryResult.error && !isRunning && resultCount > 0 && (
          <div className="overflow-hidden rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {queryResult.results.map((r, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 px-3 py-2 text-xs font-mono"
                style={{
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-40 text-[10px] w-6 text-right shrink-0">{i + 1}</span>
                  <span className="opacity-50 shrink-0 text-[10px] rounded px-1 py-0.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    {formatValueType(r.value)}
                  </span>
                  <span className="opacity-70 flex-1 truncate">{r.path}</span>
                </div>
                <div className="pl-8 opacity-90 break-all">
                  {formatValue(r.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
