/**
 * lib/jsonpath.ts
 *
 * Thin, typed wrapper around jsonpath-plus.
 * All heavy JSONPath evaluation should go through executeJsonPath()
 * so the worker can call it without React coupling.
 *
 * Privacy: paths & values stay in-memory, never reach any external service.
 */

import { JSONPath } from "jsonpath-plus";
import type { JsonValue } from "./json-document.ts";

export interface JsonPathResult {
  path: string;       // canonical path, e.g. $.users[0].email
  value: JsonValue;   // matched value (primitive or nested object)
}

export interface JsonPathQueryResult {
  results: JsonPathResult[];
  executionMs: number;
  error: string | null;
  /** True when the underlying match count exceeds the 500-result render cap. */
  truncated: boolean;
}

const MAX_RESULTS = 500;

export const EXAMPLE_QUERIES: { label: string; query: string }[] = [
  { label: "All values", query: "$.*" },
  { label: "Deep scan — all names", query: "$..name" },
  { label: "First array element", query: "$[0]" },
  { label: "All email fields", query: "$..email" },
  { label: "Keys of root object", query: "$..*" },
  { label: "Filter: numeric age > 25", query: "$..age" },
  { label: "Array slice [0:3]", query: "$[0:3]" },
  { label: "Specific nested field", query: "$.users[*].id" },
];

/**
 * Run a JSONPath expression against a parsed JSON value.
 * Returns results (max 500 to cap UI render cost) + execution time.
 * Never throws — errors are returned as { error: string }.
 */
export function executeJsonPath(doc: JsonValue, expression: string): JsonPathQueryResult {
  if (!expression.trim()) {
    return { results: [], executionMs: 0, error: null, truncated: false };
  }

  const t0 = performance.now();
  try {
    // A single `resultType: "all"` pass returns both path and value per
    // match — the previous code ran the same query twice (once for paths,
    // once for values) to assemble the same information.
    const matches: Array<{ path: string; value: JsonValue }> = JSONPath({
      path: expression,
      json: doc as object,
      resultType: "all",
    }) as Array<{ path: string; value: JsonValue }>;

    const results: JsonPathResult[] = matches.slice(0, MAX_RESULTS).map((m) => ({
      // jsonpath-plus returns paths like $['users'][0]['email']
      // normalize to dot-bracket form: $.users[0].email
      path: normalizePath(m.path),
      value: m.value ?? null,
    }));

    const executionMs = +(performance.now() - t0).toFixed(2);
    return { results, executionMs, error: null, truncated: matches.length > MAX_RESULTS };
  } catch (err) {
    const executionMs = +(performance.now() - t0).toFixed(2);
    const error = err instanceof Error ? err.message : String(err);
    return { results: [], executionMs, error: friendlyError(error), truncated: false };
  }
}

/** Convert JSONPath bracket notation to mixed dot-bracket, e.g. $['a'][0]['b'] → $.a[0].b */
function normalizePath(raw: string): string {
  return raw
    .replace(/\['([^']+)'\]/g, (_, k: string) =>
      /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? `.${k}` : `['${k}']`,
    )
    .replace(/^\$\./, "$.");   // already starts with $. — leave alone
}

function friendlyError(msg: string): string {
  if (msg.includes("Lexical error") || msg.includes("Parse error") || msg.includes("Unexpected"))
    return `Invalid JSONPath expression — check syntax near: ${msg.slice(0, 80)}`;
  return msg.slice(0, 120);
}
