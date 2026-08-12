import {
  ancestorsOf,
  buildFlatRows,
  buildSideBySideDiffRows,
  buildSearchMatcher,
  DEFAULT_FORMAT_OPTIONS,
  describeParseError,
  diffDocuments,
  searchDocument,
  stringifyWithOptions,
  type FormatOptions,
  type JsonValue,
  type ParseError,
  type SearchOptions,
} from "../lib/json-document";
import { getDynamicExpandPaths, parseTolerantJSON, type ParseMode } from "../lib/json-parser";

let doc: JsonValue | null = null;
let compareDoc: JsonValue | null = null;
let currentParseMode: ParseMode = "strict";
let currentStringError: ParseError | null = null;
let currentJsEvalStatus: "success" | "fails" = "success";
const expanded = new Set<string>(["$"]);

export type WorkerRequest =
  | { type: "parse"; text: string }
  | { type: "toggle"; path: string }
  | { type: "search"; query: string; opts?: SearchOptions }
  | { type: "reveal"; path: string }
  | { type: "compare"; text: string }
  | { type: "clear-compare" }
  | { type: "expand-all" }
  | { type: "collapse-all" }
  | { type: "stringify"; mode: "pretty" | "compact"; formatOptions?: FormatOptions }
  | { type: "jsonpath"; expression: string }
  | { type: "parse-jsonl"; text: string };

export type WorkerResponse =
  | {
      type: "parsed";
      rows: ReturnType<typeof buildFlatRows>;
      mode: ParseMode;
      stringError: ParseError | null;
      jsEvalStatus: "success" | "fails";
    }
  | { type: "error"; error: ParseError; jsEvalStatus: "success" | "fails" }
  | { type: "search-results"; paths: string[]; isInvalidRegex: boolean }
  | {
      type: "diff";
      entries: ReturnType<typeof diffDocuments>;
      sideBySideRows: ReturnType<typeof buildSideBySideDiffRows>;
    }
  | { type: "compare-error"; error: ParseError }
  | { type: "stringified"; mode: "pretty" | "compact"; text: string }
  | { type: "jsonpath-results"; result: import("../lib/jsonpath").JsonPathQueryResult }
  | { type: "jsonl-parsed"; summary: import("../lib/jsonl-parser").JsonlSummary };

function respond(message: WorkerResponse) {
  (self as unknown as Worker).postMessage(message);
}

function respondWithRows() {
  if (doc === null) return;
  respond({
    type: "parsed",
    rows: buildFlatRows(doc, expanded),
    mode: currentParseMode,
    stringError: currentStringError,
    jsEvalStatus: currentJsEvalStatus,
  });
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === "parse") {
    const res = parseTolerantJSON(message.text);
    currentParseMode = res.mode;
    currentStringError = res.stringError;
    currentJsEvalStatus = res.jsEvalStatus;

    if (res.value !== null) {
      doc = res.value;
      compareDoc = null;
      expanded.clear();
      // Dynamic auto-expansion depth calculated from size
      const dynamicPaths = getDynamicExpandPaths(res.value);
      for (const p of dynamicPaths) {
        expanded.add(p);
      }
      respondWithRows();
    } else {
      doc = null;
      respond({
        type: "error",
        error: res.stringError ?? describeParseError("Invalid JSON", message.text),
        jsEvalStatus: res.jsEvalStatus,
      });
    }
    return;
  }

  if (message.type === "toggle") {
    if (doc === null) return;
    if (expanded.has(message.path)) {
      expanded.delete(message.path);
    } else {
      expanded.add(message.path);
    }
    respondWithRows();
    return;
  }

  if (message.type === "search") {
    if (doc === null || message.query.trim() === "") {
      respond({ type: "search-results", paths: [], isInvalidRegex: false });
      return;
    }
    const opts: SearchOptions = message.opts ?? {};
    // Check for invalid regex before running the full search
    const isInvalidRegex = Boolean(opts.isRegex && buildSearchMatcher(message.query, opts) === null);
    respond({
      type: "search-results",
      paths: searchDocument(doc, message.query, opts),
      isInvalidRegex,
    });
    return;
  }

  if (message.type === "reveal") {
    if (doc === null) return;
    for (const ancestor of ancestorsOf(message.path)) {
      expanded.add(ancestor);
    }
    respondWithRows();
    return;
  }

  if (message.type === "compare") {
    if (doc === null) return;
    const res = parseTolerantJSON(message.text);
    if (res.value !== null) {
      compareDoc = res.value;
      respond({
        type: "diff",
        entries: diffDocuments(doc, compareDoc),
        sideBySideRows: buildSideBySideDiffRows(doc, compareDoc),
      });
    } else {
      compareDoc = null;
      respond({
        type: "compare-error",
        error: res.stringError ?? describeParseError("Invalid JSON", message.text),
      });
    }
    return;
  }

  if (message.type === "clear-compare") {
    compareDoc = null;
    respondWithRows();
    return;
  }

  if (message.type === "expand-all") {
    if (doc === null) return;
    function collectAllPaths(value: JsonValue, path: string) {
      if (value === null || typeof value !== "object") return;
      expanded.add(path);
      if (Array.isArray(value)) {
        value.forEach((v, i) => collectAllPaths(v, `${path}[${i}]`));
      } else {
        for (const [k, v] of Object.entries(value as Record<string, JsonValue>)) {
          collectAllPaths(v, path === "$" ? `$.${k}` : `${path}.${k}`);
        }
      }
    }
    collectAllPaths(doc, "$");
    respondWithRows();
    return;
  }

  if (message.type === "collapse-all") {
    expanded.clear();
    expanded.add("$");
    respondWithRows();
    return;
  }

  if (message.type === "stringify") {
    if (doc === null) return;
    let text: string;
    if (message.formatOptions) {
      text = stringifyWithOptions(doc, message.formatOptions);
    } else {
      // Legacy pretty/compact fallback
      const opts: FormatOptions = message.mode === "compact"
        ? { ...DEFAULT_FORMAT_OPTIONS, indent: 0 }
        : DEFAULT_FORMAT_OPTIONS;
      text = stringifyWithOptions(doc, opts);
    }
    respond({ type: "stringified", mode: message.mode, text });
  }

  if (message.type === "jsonpath") {
    if (doc === null) {
      respond({ type: "jsonpath-results", result: { results: [], executionMs: 0, error: "No document loaded" } });
      return;
    }
    const { executeJsonPath } = require("../lib/jsonpath");
    const result = executeJsonPath(doc, message.expression);
    respond({ type: "jsonpath-results", result });
    return;
  }

  if (message.type === "parse-jsonl") {
    const { parseJsonl } = require("../lib/jsonl-parser");
    const summary = parseJsonl(message.text);
    respond({ type: "jsonl-parsed", summary });
    return;
  }
};
