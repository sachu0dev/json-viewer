// Path-indexed flattening of a parsed JSON value. This is the one piece of
// architecture the plan calls non-negotiable: every view (tree, search,
// diff) reads rows built here instead of walking the raw object itself.

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type NodeType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null";

export interface Row {
  path: string;
  key: string | number | null;
  depth: number;
  type: NodeType;
  preview: string;
  hasChildren: boolean;
  childCount: number;
  isExpanded: boolean;
}

export function typeOf(value: JsonValue): NodeType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as NodeType;
}

export function childPath(parentPath: string, key: string | number): string {
  return typeof key === "number" ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
}

export function ancestorsOf(path: string): string[] {
  const ancestors: string[] = [];
  const tokenPattern = /\.[^.[\]]+|\[\d+\]/g;
  let current = "$";
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(path.slice(1))) !== null) {
    ancestors.push(current);
    current += match[0];
  }
  return ancestors;
}

const MAX_SEARCH_RESULTS = 500;

export interface SearchOptions {
  caseSensitive?: boolean;
  isRegex?: boolean;
  /** Which part of the document to search. Default: 'all' (keys + values). */
  scope?: "all" | "keys" | "values" | "paths";
  /** When true, the full key/value/path must equal the query (not just contain it). Default: false (partial). */
  exactMatch?: boolean;
}

/** Returns null if the regex pattern is invalid (only relevant when isRegex=true). */
export function buildSearchMatcher(query: string, opts: SearchOptions): ((haystack: string) => boolean) | null {
  if (opts.isRegex) {
    try {
      const flags = opts.caseSensitive ? "" : "i";
      const re = new RegExp(query, flags);
      return (s) => re.test(s);
    } catch {
      return null; // invalid regex
    }
  }
  if (opts.caseSensitive) {
    return (s) => s.includes(query);
  }
  const lower = query.toLowerCase();
  return (s) => s.toLowerCase().includes(lower);
}

export function searchDocument(root: JsonValue, query: string, opts: SearchOptions = {}): string[] {
  if (!query.trim()) return [];

  const scope = opts.scope ?? "all";
  const exactMatch = opts.exactMatch ?? false;

  // Build the matcher — for exact match we wrap to require full equality
  let matchFn: ((haystack: string) => boolean) | null;
  if (exactMatch) {
    const baseFn = buildSearchMatcher(query, opts);
    if (!baseFn) return []; // invalid regex
    const cq = opts.caseSensitive ? query : query.toLowerCase();
    matchFn = (s: string) => {
      const cs = opts.caseSensitive ? s : s.toLowerCase();
      return opts.isRegex ? baseFn(s) && new RegExp(`^(?:${query})$`, opts.caseSensitive ? "" : "i").test(s) : cs === cq;
    };
  } else {
    matchFn = buildSearchMatcher(query, opts);
  }
  if (!matchFn) return []; // invalid regex

  const matchFnSafe: (haystack: string) => boolean = matchFn;
  const results: string[] = [];

  function visit(value: JsonValue, path: string) {
    if (results.length >= MAX_SEARCH_RESULTS) return;
    const type = typeOf(value);

    if (type === "object") {
      for (const [key, child] of Object.entries(value as Record<string, JsonValue>)) {
        if (results.length >= MAX_SEARCH_RESULTS) return;
        const path2 = childPath(path, key);

        const keyMatches = (scope === "all" || scope === "keys") && matchFnSafe(key);
        const pathMatches = scope === "paths" && matchFnSafe(path2);

        if (keyMatches || pathMatches) {
          results.push(path2);
        } else if (scope !== "keys" && scope !== "paths") {
          visit(child, path2);
        } else {
          // keys-only or paths scope: still recurse but skip value matching
          visit(child, path2);
        }
      }
    } else if (type === "array") {
      (value as JsonValue[]).forEach((child, index) => {
        if (results.length < MAX_SEARCH_RESULTS) visit(child, childPath(path, index));
      });
    } else {
      // Leaf node
      const valStr = String(value);
      const pathMatches = scope === "paths" && matchFnSafe(path);
      const valMatches = (scope === "all" || scope === "values") && matchFnSafe(valStr);
      if (pathMatches || valMatches) {
        results.push(path);
      }
    }
  }

  visit(root, "$");
  return results;
}

const MAX_PREVIEW_LENGTH = 80;

export function previewOf(value: JsonValue): string {
  const type = typeOf(value);
  if (type === "object") {
    const count = Object.keys(value as object).length;
    return count === 0 ? "{}" : `{ ${count} ${count === 1 ? "key" : "keys"} }`;
  }
  if (type === "array") {
    const count = (value as JsonValue[]).length;
    return count === 0 ? "[]" : `[ ${count} ${count === 1 ? "item" : "items"} ]`;
  }
  if (type === "string") {
    const str = JSON.stringify(value);
    return str.length > MAX_PREVIEW_LENGTH ? `${str.slice(0, MAX_PREVIEW_LENGTH)}…"` : str;
  }
  return String(value);
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  snippet: string;
}

export function describeParseError(rawMessage: string, text: string): ParseError {
  let line: number;
  let column: number;

  const lineColMatch = rawMessage.match(/line (\d+) column (\d+)/);
  if (lineColMatch) {
    line = Number(lineColMatch[1]);
    column = Number(lineColMatch[2]);
  } else {
    const positionMatch = rawMessage.match(/position (\d+)/);
    const position = positionMatch ? Number(positionMatch[1]) : 0;
    const before = text.slice(0, position);
    const linesBefore = before.split("\n");
    line = linesBefore.length;
    column = linesBefore[linesBefore.length - 1].length + 1;
  }

  const snippet = text.split("\n")[line - 1]?.trim().slice(0, 60) ?? "";

  return {
    message: `Couldn't parse JSON — line ${line}, column ${column}. Check for a missing quote, a trailing comma, or a stray character nearby.`,
    line,
    column,
    snippet,
  };
}

export type DiffStatus = "added" | "removed" | "changed";

export interface DiffEntry {
  path: string;
  status: DiffStatus;
  before?: string;
  after?: string;
}

export function diffDocuments(a: JsonValue, b: JsonValue): DiffEntry[] {
  const entries: DiffEntry[] = [];

  function walk(av: JsonValue | undefined, bv: JsonValue | undefined, path: string) {
    if (av === undefined) {
      entries.push({ path, status: "added", after: previewOf(bv as JsonValue) });
      return;
    }
    if (bv === undefined) {
      entries.push({ path, status: "removed", before: previewOf(av) });
      return;
    }

    const aType = typeOf(av);
    const bType = typeOf(bv);

    if (aType !== bType) {
      entries.push({ path, status: "changed", before: previewOf(av), after: previewOf(bv) });
      return;
    }

    if (aType === "array") {
      const aArr = av as JsonValue[];
      const bArr = bv as JsonValue[];
      const maxLength = Math.max(aArr.length, bArr.length);
      for (let i = 0; i < maxLength; i++) {
        walk(aArr[i], bArr[i], childPath(path, i));
      }
      return;
    }

    if (aType === "object") {
      const aObj = av as Record<string, JsonValue>;
      const bObj = bv as Record<string, JsonValue>;
      const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
      for (const key of keys) {
        walk(aObj[key], bObj[key], childPath(path, key));
      }
      return;
    }

    if (av !== bv) {
      entries.push({ path, status: "changed", before: previewOf(av), after: previewOf(bv) });
    }
  }

  walk(a, b, "$");
  return entries;
}

export interface SideBySideDiffRow {
  path: string;
  depth: number;
  status: "same" | "added" | "removed" | "changed";
  leftKey: string | number | null;
  leftPreview: string | null;
  leftType: NodeType | null;
  rightKey: string | number | null;
  rightPreview: string | null;
  rightType: NodeType | null;
}

export function buildSideBySideDiffRows(a: JsonValue, b: JsonValue): SideBySideDiffRow[] {
  const rows: SideBySideDiffRow[] = [];

  function walk(av: JsonValue | undefined, bv: JsonValue | undefined, path: string, key: string | number | null, depth: number) {
    if (av === undefined && bv === undefined) return;

    if (av === undefined) {
      const bType = typeOf(bv as JsonValue);
      rows.push({
        path,
        depth,
        status: "added",
        leftKey: null,
        leftPreview: null,
        leftType: null,
        rightKey: key,
        rightPreview: previewOf(bv as JsonValue),
        rightType: bType,
      });
      if (bType === "object") {
        for (const [k, v] of Object.entries(bv as Record<string, JsonValue>)) {
          walk(undefined, v, childPath(path, k), k, depth + 1);
        }
      } else if (bType === "array") {
        (bv as JsonValue[]).forEach((v, i) => {
          walk(undefined, v, childPath(path, i), i, depth + 1);
        });
      }
      return;
    }

    if (bv === undefined) {
      const aType = typeOf(av);
      rows.push({
        path,
        depth,
        status: "removed",
        leftKey: key,
        leftPreview: previewOf(av),
        leftType: aType,
        rightKey: null,
        rightPreview: null,
        rightType: null,
      });
      if (aType === "object") {
        for (const [k, v] of Object.entries(av as Record<string, JsonValue>)) {
          walk(v, undefined, childPath(path, k), k, depth + 1);
        }
      } else if (aType === "array") {
        (av as JsonValue[]).forEach((v, i) => {
          walk(v, undefined, childPath(path, i), i, depth + 1);
        });
      }
      return;
    }

    const aType = typeOf(av);
    const bType = typeOf(bv);

    if (aType !== bType || (aType !== "object" && aType !== "array" && av !== bv)) {
      rows.push({
        path,
        depth,
        status: "changed",
        leftKey: key,
        leftPreview: previewOf(av),
        leftType: aType,
        rightKey: key,
        rightPreview: previewOf(bv),
        rightType: bType,
      });
      return;
    }

    rows.push({
      path,
      depth,
      status: "same",
      leftKey: key,
      leftPreview: previewOf(av),
      leftType: aType,
      rightKey: key,
      rightPreview: previewOf(bv),
      rightType: bType,
    });

    if (aType === "object" && bType === "object") {
      const aObj = av as Record<string, JsonValue>;
      const bObj = bv as Record<string, JsonValue>;
      const allKeys = Array.from(new Set([...Object.keys(aObj), ...Object.keys(bObj)]));
      for (const k of allKeys) {
        walk(aObj[k], bObj[k], childPath(path, k), k, depth + 1);
      }
    } else if (aType === "array" && bType === "array") {
      const aArr = av as JsonValue[];
      const bArr = bv as JsonValue[];
      const len = Math.max(aArr.length, bArr.length);
      for (let i = 0; i < len; i++) {
        walk(aArr[i], bArr[i], childPath(path, i), i, depth + 1);
      }
    }
  }

  walk(a, b, "$", null, 0);
  return rows;
}

export function buildFlatRows(root: JsonValue, expandedPaths: Set<string>): Row[] {
  const rows: Row[] = [];

  function visit(value: JsonValue, path: string, key: string | number | null, depth: number) {
    const type = typeOf(value);
    const isContainer = type === "object" || type === "array";
    const entries: [string | number, JsonValue][] = isContainer
      ? type === "array"
        ? (value as JsonValue[]).map((v, i) => [i, v])
        : Object.entries(value as Record<string, JsonValue>)
      : [];
    const isExpanded = isContainer && expandedPaths.has(path);

    rows.push({
      path,
      key,
      depth,
      type,
      preview: previewOf(value),
      hasChildren: isContainer && entries.length > 0,
      childCount: entries.length,
      isExpanded,
    });

    if (isExpanded) {
      for (const [childKey, childValue] of entries) {
        visit(childValue, childPath(path, childKey), childKey, depth + 1);
      }
    }
  }

  visit(root, "$", null, 0);
  return rows;
}

export interface FormatOptions {
  /** Number of spaces, or "tab" for tab indentation, or 0 for compact */
  indent: 2 | 4 | "tab" | 0;
  /** Sort object keys alphabetically */
  sortKeys: boolean;
  /** Append a trailing newline to the output */
  trailingNewline: boolean;
}

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  indent: 2,
  sortKeys: false,
  trailingNewline: false,
};

function sortedReplacer(_key: string, value: JsonValue): JsonValue {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const sorted: Record<string, JsonValue> = {};
    for (const k of Object.keys(value as Record<string, JsonValue>).sort()) {
      sorted[k] = (value as Record<string, JsonValue>)[k];
    }
    return sorted;
  }
  return value;
}

export function stringifyWithOptions(doc: JsonValue, opts: FormatOptions): string {
  const replacer = opts.sortKeys ? sortedReplacer : null;
  const indentArg: number | string = opts.indent === "tab" ? "\t" : opts.indent;
  const text = JSON.stringify(doc, replacer as (key: string, value: unknown) => unknown, indentArg);
  return opts.trailingNewline ? text + "\n" : text;
}
