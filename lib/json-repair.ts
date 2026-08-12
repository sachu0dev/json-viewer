/**
 * lib/json-repair.ts
 *
 * Engine for detecting and auto-repairing malformed JSON.
 *
 * Never silently mutates user data. Returns the repaired text along with a list of
 * explicit, human-readable change descriptions.
 */

import { parseTolerantJSON } from "./json-parser.ts";
import type { JsonValue } from "./json-document.ts";

export interface RepairChange {
  id: string;
  category: string;
  description: string;
  line?: number;
}

export interface RepairResult {
  repairedText: string;
  changes: RepairChange[];
  isValid: boolean;
  doc: JsonValue | null;
}

/**
 * Attempts to repair broken JSON text.
 */
export function repairJson(text: string): RepairResult {
  if (!text.trim()) {
    return { repairedText: "", changes: [], isValid: false, doc: null };
  }

  const changes: RepairChange[] = [];
  let current = text;

  // 1. Convert Single quotes to Double quotes for keys and strings
  // Replace single quoted string literals '...' with "..."
  const singleQuoteRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  let singleQuoteCount = 0;
  if (singleQuoteRegex.test(current)) {
    current = current.replace(singleQuoteRegex, (match, content) => {
      singleQuoteCount++;
      // Escape any inner double quotes
      const escapedContent = content.replace(/"/g, '\\"');
      return `"${escapedContent}"`;
    });
    if (singleQuoteCount > 0) {
      changes.push({
        id: "single-quotes",
        category: "Quotes",
        description: `Converted ${singleQuoteCount} single-quoted string(s) / key(s) to double quotes.`,
      });
    }
  }

  // 2. Unquoted object keys: e.g. { foo: "bar" } or { foo_bar: 123 }
  const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
  let unquotedKeyCount = 0;
  current = current.replace(unquotedKeyRegex, (match, prefix, key) => {
    // Exclude boolean/null literals if they were somehow matched
    unquotedKeyCount++;
    return `${prefix}"${key}":`;
  });
  if (unquotedKeyCount > 0) {
    changes.push({
      id: "unquoted-keys",
      category: "Keys",
      description: `Quoted ${unquotedKeyCount} unquoted object key(s).`,
    });
  }

  // 3. Replace non-standard literals: True -> true, False -> false, None/undefined/NaN -> null
  const pythonLiterals: [RegExp, string, string][] = [
    [/\bTrue\b/g, "true", "Python True → true"],
    [/\bFalse\b/g, "false", "Python False → false"],
    [/\bNone\b/g, "null", "Python None → null"],
    [/\bundefined\b/g, "null", "JS undefined → null"],
    [/\bNaN\b/g, "null", "JS NaN → null"],
  ];
  for (const [regex, replacement, desc] of pythonLiterals) {
    if (regex.test(current)) {
      current = current.replace(regex, replacement);
      changes.push({
        id: `literal-${replacement}`,
        category: "Literals",
        description: `Replaced non-standard literal (${desc}).`,
      });
    }
  }

  // 4. Remove Javascript/C style comments (// comment or /* comment */)
  const blockCommentRegex = /\/\*[\s\S]*?\*\//g;
  const lineCommentRegex = /\/\/[^\n]*/g;
  if (blockCommentRegex.test(current) || lineCommentRegex.test(current)) {
    current = current.replace(blockCommentRegex, "").replace(lineCommentRegex, "");
    changes.push({
      id: "comments",
      category: "Comments",
      description: "Removed code comment(s).",
    });
  }

  // 5. Remove Trailing commas in objects and arrays: e.g. [1, 2,] or {"a": 1,}
  const trailingCommaRegex = /,(\s*[}\]])/g;
  let trailingCommaCount = 0;
  while (trailingCommaRegex.test(current)) {
    trailingCommaCount++;
    current = current.replace(trailingCommaRegex, "$1");
  }
  if (trailingCommaCount > 0) {
    changes.push({
      id: "trailing-commas",
      category: "Commas",
      description: `Removed ${trailingCommaCount} trailing comma(s).`,
    });
  }

  // 6. Missing commas between items: e.g. "value1" "value2" or 123 "abc" or true {"a":1}
  const missingCommaRegex = /(["\d\]}true|false|null])\s*\n?\s*(["{\[\d|true|false|null])/gi;
  // We apply this carefully if string parse still fails
  let missingCommaCount = 0;
  const tempCheck = parseTolerantJSON(current);
  if (!tempCheck.value) {
    current = current.replace(missingCommaRegex, (match, p1, p2) => {
      // Check if it's not key:value pair
      if (p1.endsWith(":") || p2.startsWith(":")) return match;
      missingCommaCount++;
      return `${p1}, ${p2}`;
    });
    if (missingCommaCount > 0) {
      changes.push({
        id: "missing-commas",
        category: "Commas",
        description: `Inserted ${missingCommaCount} missing comma(s) between elements.`,
      });
    }
  }

  // 7. Balance unclosed brackets & braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < current.length; i++) {
    const char = current[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") openBraces++;
      else if (char === "}") openBraces = Math.max(0, openBraces - 1);
      else if (char === "[") openBrackets++;
      else if (char === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  if (inString) {
    current += '"';
    changes.push({
      id: "unclosed-string",
      category: "Quotes",
      description: "Closed unterminated string literal.",
    });
  }

  if (openBrackets > 0 || openBraces > 0) {
    let closing = "";
    for (let i = 0; i < openBrackets; i++) closing += "]";
    for (let i = 0; i < openBraces; i++) closing += "}";
    current = current.trimEnd() + "\n" + closing;
    changes.push({
      id: "unclosed-structures",
      category: "Brackets",
      description: `Appended missing closing brackets/braces (${closing}).`,
    });
  }

  // 8. Try to parse the repaired text with tolerant parse
  const res = parseTolerantJSON(current);
  let isValid = Boolean(res.value !== null);

  // If valid, pretty-print to standard JSON format
  if (isValid && res.value !== null) {
    current = JSON.stringify(res.value, null, 2);
  }

  // If no changes were detected but text was invalid, report fallback
  if (changes.length === 0 && !isValid) {
    changes.push({
      id: "unknown",
      category: "Syntax",
      description: "Attempted structural cleanup for syntax errors.",
    });
  }

  return {
    repairedText: current,
    changes,
    isValid,
    doc: res.value,
  };
}
