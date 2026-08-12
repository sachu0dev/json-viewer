import {
  ancestorsOf,
  buildFlatRows,
  buildSideBySideDiffRows,
  describeParseError,
  diffDocuments,
  searchDocument,
  type JsonValue,
  type ParseError,
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
  | { type: "search"; query: string }
  | { type: "reveal"; path: string }
  | { type: "compare"; text: string }
  | { type: "clear-compare" }
  | { type: "stringify"; mode: "pretty" | "compact" };

export type WorkerResponse =
  | {
      type: "parsed";
      rows: ReturnType<typeof buildFlatRows>;
      mode: ParseMode;
      stringError: ParseError | null;
      jsEvalStatus: "success" | "fails";
    }
  | { type: "error"; error: ParseError; jsEvalStatus: "success" | "fails" }
  | { type: "search-results"; paths: string[] }
  | {
      type: "diff";
      entries: ReturnType<typeof diffDocuments>;
      sideBySideRows: ReturnType<typeof buildSideBySideDiffRows>;
    }
  | { type: "compare-error"; error: ParseError }
  | { type: "stringified"; mode: "pretty" | "compact"; text: string };

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
      respond({ type: "search-results", paths: [] });
      return;
    }
    respond({ type: "search-results", paths: searchDocument(doc, message.query) });
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

  if (message.type === "stringify") {
    if (doc === null) return;
    const text = message.mode === "pretty" ? JSON.stringify(doc, null, 2) : JSON.stringify(doc);
    respond({ type: "stringified", mode: message.mode, text });
  }
};
