import { describeParseError, type JsonValue, type ParseError, typeOf } from "./json-document.ts";

export type ParseMode = "strict" | "js-eval" | "partial" | "error";

export interface TolerantParseResult {
  value: JsonValue | null;
  mode: ParseMode;
  stringError: ParseError | null;
  jsEvalStatus: "success" | "fails";
}

function evaluateJSObject(text: string): JsonValue | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^[({[\s"'-0-9tfn]/i.test(trimmed)) return null;

  try {
    const fn = new Function(`"use strict"; return (${trimmed});`);
    const val = fn();
    return JSON.parse(JSON.stringify(val)) as JsonValue;
  } catch {
    return null;
  }
}

function parsePartialJSON(text: string, position: number): JsonValue | null {
  if (position <= 0) return null;
  const prefix = text.slice(0, position);

  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < prefix.length; i++) {
    const char = prefix[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        stack.push("}");
      } else if (char === "[") {
        stack.push("]");
      } else if (char === "}" || char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  let sanitized = prefix.trim();
  sanitized = sanitized.replace(/,[\s]*$/, "");

  if (inString) {
    sanitized += '"';
  }

  while (stack.length > 0) {
    sanitized += stack.pop();
  }

  try {
    return JSON.parse(sanitized) as JsonValue;
  } catch {
    return evaluateJSObject(sanitized);
  }
}

// Splits `content` (text between an outer `{`/`}` or `[`/`]`, exclusive) into
// its top-level comma-separated members, ignoring commas inside strings or
// nested containers. Handles a truncated final member (no trailing bracket).
function splitTopLevelMembers(content: string): string[] {
  const members: string[] = [];
  let depth = 0;
  let inString = false;
  let isEscaped = false;
  let start = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (inString) {
      if (isEscaped) isEscaped = false;
      else if (char === "\\") isEscaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") depth--;
    else if (char === "," && depth === 0) {
      members.push(content.slice(start, i));
      start = i + 1;
    }
  }
  const last = content.slice(start);
  if (last.trim()) members.push(last);
  return members;
}

// Finds the first top-level `:` in a `"key": value` member, ignoring colons
// inside the key string.
function splitKeyValue(member: string): { key: string; value: string } | null {
  let inString = false;
  let isEscaped = false;
  for (let i = 0; i < member.length; i++) {
    const char = member[i];
    if (inString) {
      if (isEscaped) isEscaped = false;
      else if (char === "\\") isEscaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === ":") {
      return { key: member.slice(0, i), value: member.slice(i + 1) };
    }
  }
  return null;
}

function parseCell(text: string): JsonValue | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as JsonValue;
  } catch {
    // fall through
  }
  const evaluated = evaluateJSObject(trimmed);
  if (evaluated !== null) return evaluated;
  return recoverByCells(trimmed);
}

// Recovers as much of a broken object/array as possible by parsing each
// top-level member independently, so one bad entry (wherever it sits — top,
// middle, or bottom) doesn't sink its siblings. Bad members become an error
// string placeholder instead of aborting the whole container.
function recoverByCells(text: string): JsonValue | null {
  const trimmed = text.trim();
  const first = trimmed[0];
  if (first !== "{" && first !== "[") return null;

  const closer = first === "{" ? "}" : "]";
  const lastCloser = trimmed.lastIndexOf(closer);
  const inner = lastCloser > 0 ? trimmed.slice(1, lastCloser) : trimmed.slice(1);
  const members = splitTopLevelMembers(inner);
  if (members.length === 0) return first === "{" ? {} : [];

  if (first === "{") {
    const result: Record<string, JsonValue> = {};
    for (const member of members) {
      const split = splitKeyValue(member);
      if (!split) continue;
      let key: string;
      try {
        key = JSON.parse(split.key.trim()) as string;
      } catch {
        continue;
      }
      const parsed = parseCell(split.value);
      result[key] = parsed !== null ? parsed : `⚠ unparsable: ${split.value.trim().slice(0, 80)}`;
    }
    return result;
  }

  return members.map((member) => {
    const parsed = parseCell(member);
    return parsed !== null ? parsed : `⚠ unparsable: ${member.trim().slice(0, 80)}`;
  });
}

export function parseTolerantJSON(text: string): TolerantParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      value: null,
      mode: "error",
      stringError: null,
      jsEvalStatus: "fails",
    };
  }

  // 1. Strict JSON parse
  try {
    const val = JSON.parse(text) as JsonValue;
    return {
      value: val,
      mode: "strict",
      stringError: null,
      jsEvalStatus: "success",
    };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "Invalid JSON";
    const stringError = describeParseError(rawMessage, text);

    const posMatch = rawMessage.match(/position (\d+)/);
    const position = posMatch ? Number(posMatch[1]) : 0;

    // 2. Try JS object evaluation
    const jsEvalVal = evaluateJSObject(text);
    if (jsEvalVal !== null) {
      return {
        value: jsEvalVal,
        mode: "js-eval",
        stringError,
        jsEvalStatus: "success",
      };
    }

    // 3. Try per-cell recovery: split top-level {}/[] members and parse each
    // independently, so an error in the middle only drops that one entry.
    const cellVal = recoverByCells(text);
    if (cellVal !== null) {
      return {
        value: cellVal,
        mode: "partial",
        stringError,
        jsEvalStatus: "fails",
      };
    }

    // 4. Fall back to prefix-truncation recovery (e.g. broken scalar root).
    const partialVal = parsePartialJSON(text, position);
    if (partialVal !== null) {
      return {
        value: partialVal,
        mode: "partial",
        stringError,
        jsEvalStatus: "fails",
      };
    }

    return {
      value: null,
      mode: "error",
      stringError,
      jsEvalStatus: "fails",
    };
  }
}

export function getDynamicExpandPaths(root: JsonValue): Set<string> {
  const expanded = new Set<string>(["$"]);
  let totalNodes = 0;

  function count(val: JsonValue): number {
    let num = 1;
    const type = typeOf(val);
    if (type === "object") {
      for (const child of Object.values(val as Record<string, JsonValue>)) {
        num += count(child);
      }
    } else if (type === "array") {
      for (const child of val as JsonValue[]) {
        num += count(child);
      }
    }
    return num;
  }

  totalNodes = count(root);

  let maxDepth = 1;
  if (totalNodes <= 150) {
    maxDepth = 20;
  } else if (totalNodes <= 3000) {
    maxDepth = 3;
  } else {
    maxDepth = 1;
  }

  function collect(val: JsonValue, path: string, depth: number) {
    if (depth > maxDepth) return;
    const type = typeOf(val);
    if (type === "object") {
      expanded.add(path);
      for (const [key, child] of Object.entries(val as Record<string, JsonValue>)) {
        collect(child, typeof key === "number" ? `${path}[${key}]` : `${path}.${key}`, depth + 1);
      }
    } else if (type === "array") {
      expanded.add(path);
      (val as JsonValue[]).forEach((child, index) => {
        collect(child, `${path}[${index}]`, depth + 1);
      });
    }
  }

  collect(root, "$", 1);
  return expanded;
}
