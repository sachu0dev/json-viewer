"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EXAMPLE_QUERIES, executeJsonPath } from "@/lib/jsonpath";
import { parseTolerantJSON } from "@/lib/json-parser";
import { listQueryHistory, recordQuery, clearQueryHistory } from "@/lib/jsonpath-history";
import { track } from "@/lib/analytics";
import type { JsonValue } from "@/lib/json-document";
import { useTheme } from "@/hooks/useTheme";
import { ToolShell } from "./ToolShell";
import { ToolIntro } from "./ToolIntro";
import { JsonEditorArea } from "./JsonEditorArea";
import { useDialog } from "./DialogProvider";

const QUICK_REFERENCE: [string, string][] = [
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
];

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

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

interface Props {
  /** Pre-populated JSON from URL hash — undefined if standalone page */
  initialJson?: string;
}

export function JsonPathPlayground({ initialJson }: Props) {
  const [jsonText, setJsonText] = useState(initialJson ?? "");
  const [expression, setExpression] = useState("$.*");
  const [refOpen, setRefOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const dialog = useDialog();

  useEffect(() => {
    // Deferred via microtask (not called synchronously in the effect body):
    // avoids a hydration mismatch, since localStorage isn't available during
    // SSR — the pre-hydration render must render the same empty list on
    // both server and client, then pick up real history right after mount.
    queueMicrotask(() => setHistory(listQueryHistory()));
  }, []);

  // Derive parsed JSON document and parse errors
  const { parsedDoc, jsonError } = useMemo(() => {
    if (!jsonText.trim()) {
      return { parsedDoc: null, jsonError: null };
    }
    try {
      const result = parseTolerantJSON(jsonText);
      return { parsedDoc: result.value, jsonError: null };
    } catch {
      return { parsedDoc: null, jsonError: "Invalid JSON — fix the input before querying." };
    }
  }, [jsonText]);

  const debouncedExpression = useDebounced(expression, 200);

  // Derive JSONPath query result
  const queryResult = useMemo(() => {
    if (!parsedDoc || !debouncedExpression.trim()) return null;
    return executeJsonPath(parsedDoc, debouncedExpression);
  }, [parsedDoc, debouncedExpression]);

  // Record a query to history once it settles and actually produced matches
  // — not on every keystroke, and not queries that never matched anything.
  // Deferred via microtask for the same reason as the initial-load effect
  // above: keeps the state write out of the synchronous effect body.
  useEffect(() => {
    if (queryResult && !queryResult.error && queryResult.results.length > 0) {
      queueMicrotask(() => setHistory(recordQuery(debouncedExpression)));
    }
  }, [queryResult, debouncedExpression]);

  // Already debounced (debouncedExpression, 200ms), so this tracks once per
  // settled query rather than per keystroke. Never the expression or result
  // values themselves — just whether it ran and how many matches it found.
  useEffect(() => {
    if (!queryResult) return;
    track("jsonpath_query_run", {
      result_count: queryResult.results.length,
      has_error: Boolean(queryResult.error),
    });
  }, [queryResult]);

  const resultCount = queryResult?.results.length ?? 0;

  const presetSlot = initialJson ? (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono"
      style={{ backgroundColor: theme.colors.active, color: theme.colors.accent, border: `1px solid ${theme.colors.border}` }}
    >
      ✓ loaded from viewer
    </span>
  ) : undefined;

  return (
    <ToolShell
      title="JSONPath"
      activeHref="/jsonpath"
      presetSlot={presetSlot}
      commands={[
        { id: "focus-query", label: "Focus JSONPath expression input" },
        { id: "toggle-reference", label: "Toggle quick reference" },
        { id: "clear-history", label: "Clear query history" },
      ]}
      onSelectCommand={(id) => {
        if (id === "focus-query") queryInputRef.current?.focus();
        else if (id === "toggle-reference") setRefOpen((v) => !v);
        else if (id === "clear-history") {
          dialog
            .confirm({ title: "Clear query history", message: "Remove all saved JSONPath queries? This can't be undone.", confirmLabel: "Clear", danger: true })
            .then((ok) => {
              if (ok) {
                track("feature_used", { feature: "clear_query_history" });
                clearQueryHistory();
                setHistory([]);
              }
            });
        }
      }}
    >
      <div className="flex h-full flex-col">
        <ToolIntro heading="JSONPath Tester" active={Boolean(jsonText.trim())}>
          Run JSONPath expressions against your JSON and see every matching path and value
          highlighted instantly as you type. Comes with a quick reference for common syntax
          (<span className="font-mono">$..</span>, <span className="font-mono">[*]</span>,
          slices, filters), example queries you can load with one click, and a history of what
          you&apos;ve tried. Runs entirely client-side — nothing you paste is ever sent anywhere.
        </ToolIntro>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ── Left: JSON input ── */}
        <div className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r lg:w-1/2" style={{ borderColor: theme.colors.border }}>
          <div
            className="flex items-center justify-between px-3 py-1.5 text-xs font-medium border-b shrink-0"
            style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.muted }}
          >
            <label htmlFor="jsonpath-json-input" className="cursor-default">
              JSON Input
            </label>
            <span className="flex items-center gap-2 text-[10px] font-mono opacity-70">
              {jsonText && <span>{jsonText.length.toLocaleString()} chars</span>}
              {parsedDoc && !jsonError && <span className="text-emerald-500">✓ valid</span>}
              {jsonError && <span className="text-red-400">✕ invalid</span>}
            </span>
          </div>
          <div className="flex-1 min-h-50">
            <JsonEditorArea
              value={jsonText}
              onChange={setJsonText}
              theme={theme}
              ariaLabel="JSON input to query"
              placeholder={'Paste your JSON here…\n\n{"users": [{"name": "Alice", "age": 30}]}'}
            />
          </div>
        </div>

        {/* ── Right: query + results ── */}
        <div className="flex flex-col min-h-0 lg:w-1/2">
          {/* Query bar */}
          <div className="border-b px-3 py-2 shrink-0" style={{ borderColor: theme.colors.border }}>
            <label htmlFor="jsonpath-query-input" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider font-mono opacity-70" style={{ color: theme.colors.muted }}>
              JSONPath Expression
            </label>
            <div className="flex gap-2">
              <input
                id="jsonpath-query-input"
                ref={queryInputRef}
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                onFocus={() => setHistoryOpen(true)}
                onBlur={() => setTimeout(() => setHistoryOpen(false), 150)}
                placeholder="$.users[*].email"
                className="flex-1 rounded-lg px-3 py-2 font-mono text-sm outline-none border transition-colors"
                style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border, color: theme.colors.fg }}
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            {historyOpen && history.length > 0 && (
              <div
                className="mt-1.5 max-h-32 overflow-y-auto rounded-lg border text-xs font-mono"
                style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
              >
                {history.map((q) => (
                  <button
                    key={q}
                    onMouseDown={() => setExpression(q)}
                    className="block w-full truncate px-3 py-1.5 text-left hover:opacity-80"
                    style={{ color: theme.colors.fg }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Example queries */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q.query}
                  onClick={() => {
                    track("feature_used", { feature: "load_example_query" });
                    setExpression(q.query);
                  }}
                  className="rounded px-2.5 py-1 font-mono text-[11px] border transition-all hover:scale-105"
                  style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.fg }}
                  title={q.label}
                >
                  {q.query}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3" aria-live="polite">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono opacity-70" style={{ color: theme.colors.muted }}>
                Results
              </span>
              {queryResult && !queryResult.error && (
                <span className="text-xs font-mono" style={{ color: theme.colors.muted }}>
                  {resultCount} match{resultCount !== 1 ? "es" : ""}
                  {queryResult.truncated ? " (capped at 500)" : ""} · {queryResult.executionMs}ms
                </span>
              )}
            </div>

            {!jsonText.trim() && (
              <div className="rounded-lg p-6 text-center text-sm font-mono border border-dashed" style={{ borderColor: theme.colors.border, color: theme.colors.muted }}>
                Paste JSON on the left to start querying
              </div>
            )}

            {jsonText.trim() && jsonError && (
              <div className="rounded-lg p-4 text-sm text-red-400 border border-red-500/30 bg-red-500/10">Fix the JSON input before querying.</div>
            )}

            {queryResult?.error && (
              <div className="rounded-lg p-4 text-sm text-red-400 border border-red-500/30 bg-red-500/10">
                <span className="font-semibold">Expression error: </span>
                {queryResult.error}
              </div>
            )}

            {queryResult && !queryResult.error && resultCount === 0 && (
              <div className="rounded-lg p-6 text-center text-sm font-mono border border-dashed" style={{ borderColor: theme.colors.border, color: theme.colors.muted }}>
                No matches
              </div>
            )}

            {queryResult && !queryResult.error && resultCount > 0 && (
              <div className="divide-y overflow-hidden rounded-lg border" style={{ borderColor: theme.colors.border }}>
                {queryResult.results.map((r, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-0.5 px-3 py-2 text-xs font-mono"
                    style={{ borderColor: theme.colors.border, backgroundColor: i % 2 === 0 ? theme.colors.bg : theme.colors.panel }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-6 text-right shrink-0" style={{ color: theme.colors.muted }}>
                        {i + 1}
                      </span>
                      <span className="shrink-0 text-[10px] rounded px-1.5 py-0.5 border" style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.accent }}>
                        {formatValueType(r.value)}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.path)}
                        className="flex-1 truncate text-left font-semibold hover:underline"
                        style={{ color: theme.colors.fg }}
                        title="Copy path"
                      >
                        {r.path}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(formatValue(r.value))}
                        className="shrink-0 text-[10px] opacity-60 hover:opacity-100"
                        style={{ color: theme.colors.muted }}
                        title="Copy value"
                      >
                        copy
                      </button>
                    </div>
                    <div className="pl-8 break-all opacity-90" style={{ color: theme.colors.fg }}>
                      {formatValue(r.value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Bottom: collapsible quick reference ── */}
          <div className="border-t shrink-0" style={{ borderColor: theme.colors.border }}>
            <button
              onClick={() => setRefOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider font-mono opacity-70 hover:opacity-100"
              style={{ color: theme.colors.muted }}
              aria-expanded={refOpen}
            >
              <span>JSONPath Quick Reference</span>
              <span>{refOpen ? "▾" : "▸"}</span>
            </button>
            {refOpen && (
              <div className="grid gap-2 sm:grid-cols-2 px-3 pb-3 text-xs font-mono max-h-56 overflow-y-auto">
                {QUICK_REFERENCE.map(([expr, desc]) => (
                  <button
                    key={expr}
                    onClick={() => setExpression(expr)}
                    className="rounded p-2 border text-left transition-colors hover:opacity-80"
                    style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border }}
                  >
                    <div className="font-semibold" style={{ color: theme.colors.accent }}>
                      {expr}
                    </div>
                    <div className="mt-0.5 font-sans text-[11px]" style={{ color: theme.colors.muted }}>
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ToolShell>
  );
}
