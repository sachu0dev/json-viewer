/**
 * lib/converters/yaml.ts
 *
 * Lightweight, zero-dependency JSON ↔ YAML converter.
 */

export function convertJsonToYaml(jsonText: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `# Invalid JSON input\n# ${err instanceof Error ? err.message : String(err)}`;
  }

  return stringifyYaml(parsed, 0);
}

// Scalars YAML 1.1 loaders (the spec most real-world parsers, incl. PyYAML's
// default and js-yaml's failsafe-adjacent schema, implement) parse as
// bool/null rather than string — must be quoted or they round-trip as the
// wrong type.
const YAML_RESERVED_SCALARS = new Set([
  "true", "false", "yes", "no", "on", "off", "y", "n", "null", "~", "",
]);

function looksLikeYamlNumber(s: string): boolean {
  return /^[-+]?(\d+(\.\d+)?([eE][-+]?\d+)?|0x[0-9a-fA-F]+|0o[0-7]+|\.inf|\.nan)$/i.test(s);
}

function needsYamlQuoting(val: string): boolean {
  if (val.trim() === "") return true;
  if (val !== val.trim()) return true; // leading/trailing whitespace is lost unquoted
  if (YAML_RESERVED_SCALARS.has(val.toLowerCase())) return true;
  if (looksLikeYamlNumber(val)) return true;
  // Leading indicator characters and value-flow syntax that change meaning
  // unquoted: anchors, tags, flow collections, quotes, comments, block
  // scalar markers, and `key:`/`- `/`? ` sequence-or-mapping markers.
  if (/^[\[\]{},&*!|>'"%@`#]/.test(val)) return true;
  if (/^[-?:](\s|$)/.test(val)) return true;
  if (val.includes(": ") || val.endsWith(":")) return true;
  if (val.includes(" #")) return true;
  return false;
}

function escapeYamlDoubleQuoted(val: string): string {
  return val.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function stringifyYaml(val: unknown, depth: number): string {
  const indent = "  ".repeat(depth);

  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") {
    if (val.includes("\n")) {
      // Preserve embedded newlines with a literal block scalar. A raw
      // newline placed inside a double-quoted YAML scalar gets *folded*
      // per spec (a single newline becomes a space, runs of them collapse),
      // so the previous `"...\n..."` form silently merged lines back
      // together on re-parse instead of erroring loudly.
      const bodyIndent = "  ".repeat(depth + 1);
      const body = val
        .split("\n")
        .map((line) => (line ? `${bodyIndent}${line}` : ""))
        .join("\n");
      return `|-\n${body}`;
    }
    if (needsYamlQuoting(val)) {
      return `"${escapeYamlDoubleQuoted(val)}"`;
    }
    return val;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    const lines: string[] = [];
    for (const item of val) {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const itemStr = stringifyYaml(item, depth + 1).trimStart();
        lines.push(`${indent}- ${itemStr}`);
      } else {
        lines.push(`${indent}- ${stringifyYaml(item, depth)}`);
      }
    }
    return "\n" + lines.join("\n");
  }

  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const lines: string[] = [];
    for (const [k, v] of entries) {
      const keyStr = /^[a-zA-Z0-9_$]+$/.test(k) ? k : `"${escapeYamlDoubleQuoted(k)}"`;
      if (typeof v === "object" && v !== null) {
        lines.push(`${indent}${keyStr}:${stringifyYaml(v, depth + 1)}`);
      } else {
        lines.push(`${indent}${keyStr}: ${stringifyYaml(v, depth)}`);
      }
    }
    return (depth > 0 ? "\n" : "") + lines.join("\n");
  }

  return String(val);
}
