import { describeParseError, type JsonValue, type ParseError, typeOf } from "./json-document.ts";

export type ParseMode = "strict" | "js-eval" | "partial" | "error";

export interface TolerantParseResult {
  value: JsonValue | null;
  mode: ParseMode;
  stringError: ParseError | null;
  jsEvalStatus: "success" | "fails";
}

// Hand-rolled recursive-descent parser for JS-object-literal syntax (unquoted
// keys, single-quoted strings, trailing commas) that a strict JSON.parse
// rejects but a human pasting from a JS console/log would produce. This used
// to be `new Function(...)(...)`, which works but means CSP has to grant
// 'unsafe-eval' to the whole page just for this one tolerant-paste fallback,
// and it happily executes arbitrary pasted JavaScript, not just object
// literals. This parser accepts exactly the same class of input (objects,
// arrays, strings, numbers, booleans, null/undefined/NaN/Infinity) without
// evaluating anything.
class JsLiteralSyntaxError extends Error {}

function parseJsObjectLiteral(source: string): JsonValue {
  let i = 0;
  const len = source.length;

  function skipTrivia() {
    while (i < len) {
      const c = source[i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") {
        i++;
      } else if (c === "/" && source[i + 1] === "/") {
        i += 2;
        while (i < len && source[i] !== "\n") i++;
      } else if (c === "/" && source[i + 1] === "*") {
        i += 2;
        while (i < len && !(source[i] === "*" && source[i + 1] === "/")) i++;
        i += 2;
      } else {
        break;
      }
    }
  }

  function fail(message: string): never {
    throw new JsLiteralSyntaxError(`${message} at position ${i}`);
  }

  function matchKeyword(word: string): boolean {
    if (!source.startsWith(word, i)) return false;
    const next = source[i + word.length];
    if (next !== undefined && /[A-Za-z0-9_$]/.test(next)) return false;
    i += word.length;
    return true;
  }

  function parseString(quote: string): string {
    i++; // opening quote
    let result = "";
    while (i < len) {
      const c = source[i];
      if (c === quote) {
        i++;
        return result;
      }
      if (c === "\\") {
        const esc = source[i + 1];
        switch (esc) {
          case '"':
          case "'":
          case "\\":
          case "/":
            result += esc;
            i += 2;
            break;
          case "n":
            result += "\n";
            i += 2;
            break;
          case "t":
            result += "\t";
            i += 2;
            break;
          case "r":
            result += "\r";
            i += 2;
            break;
          case "b":
            result += "\b";
            i += 2;
            break;
          case "f":
            result += "\f";
            i += 2;
            break;
          case "u": {
            const hex = source.slice(i + 2, i + 6);
            result += String.fromCharCode(parseInt(hex, 16));
            i += 6;
            break;
          }
          default:
            result += esc ?? "";
            i += 2;
        }
        continue;
      }
      result += c;
      i++;
    }
    fail("Unterminated string");
  }

  function parseNumber(): number {
    const start = i;
    if (source[i] === "+" || source[i] === "-") i++;
    while (i < len && source[i] >= "0" && source[i] <= "9") i++;
    if (source[i] === ".") {
      i++;
      while (i < len && source[i] >= "0" && source[i] <= "9") i++;
    }
    if (source[i] === "e" || source[i] === "E") {
      i++;
      if (source[i] === "+" || source[i] === "-") i++;
      while (i < len && source[i] >= "0" && source[i] <= "9") i++;
    }
    const num = Number(source.slice(start, i));
    if (Number.isNaN(num)) fail("Invalid number");
    return num;
  }

  function parseKey(): string {
    const c = source[i];
    if (c === '"' || c === "'") return parseString(c);
    const start = i;
    while (i < len && source[i] !== ":" && !/\s/.test(source[i])) i++;
    if (i === start) fail("Expected object key");
    return source.slice(start, i);
  }

  function parseArray(): JsonValue[] {
    i++; // [
    const arr: JsonValue[] = [];
    skipTrivia();
    if (source[i] === "]") {
      i++;
      return arr;
    }
    for (;;) {
      arr.push(parseValue());
      skipTrivia();
      if (source[i] === ",") {
        i++;
        skipTrivia();
        if (source[i] === "]") {
          i++;
          break;
        }
        continue;
      }
      if (source[i] === "]") {
        i++;
        break;
      }
      fail("Expected ',' or ']'");
    }
    return arr;
  }

  function parseObject(): Record<string, JsonValue> {
    i++; // {
    const obj: Record<string, JsonValue> = {};
    skipTrivia();
    if (source[i] === "}") {
      i++;
      return obj;
    }
    for (;;) {
      skipTrivia();
      const key = parseKey();
      skipTrivia();
      if (source[i] !== ":") fail("Expected ':'");
      i++;
      obj[key] = parseValue();
      skipTrivia();
      if (source[i] === ",") {
        i++;
        skipTrivia();
        if (source[i] === "}") {
          i++;
          break;
        }
        continue;
      }
      if (source[i] === "}") {
        i++;
        break;
      }
      fail("Expected ',' or '}'");
    }
    return obj;
  }

  function parseValue(): JsonValue {
    skipTrivia();
    const c = source[i];
    if (c === undefined) fail("Unexpected end of input");
    if (c === "{") return parseObject();
    if (c === "[") return parseArray();
    if (c === '"' || c === "'") return parseString(c);
    if (c === "-" || c === "+") {
      if (source.startsWith("Infinity", i + 1)) {
        i += 1 + "Infinity".length;
        return null; // matches JSON.stringify(±Infinity) === "null"
      }
      return parseNumber();
    }
    if ((c >= "0" && c <= "9") || c === ".") return parseNumber();
    if (matchKeyword("true")) return true;
    if (matchKeyword("false")) return false;
    if (matchKeyword("null")) return null;
    if (matchKeyword("undefined")) return null; // JSON.stringify(undefined) has no valid JSON form; null is the closest fit
    if (matchKeyword("NaN")) return null; // matches JSON.stringify(NaN) === "null"
    if (matchKeyword("Infinity")) return null;
    fail(`Unexpected token '${c}'`);
  }

  const value = parseValue();
  skipTrivia();
  if (i !== len) fail("Unexpected trailing content");
  return value;
}

function evaluateJSObject(text: string): JsonValue | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/^[({[\s"'-0-9tfn]/i.test(trimmed)) return null;

  try {
    return parseJsObjectLiteral(trimmed);
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
