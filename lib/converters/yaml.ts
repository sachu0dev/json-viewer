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

function stringifyYaml(val: unknown, depth: number): string {
  const indent = "  ".repeat(depth);

  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") {
    if (val.includes("\n") || val.includes(":") || val.includes("#") || val.trim() === "") {
      return `"${val.replace(/"/g, '\\"')}"`;
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
      const keyStr = /^[a-zA-Z0-9_$]+$/.test(k) ? k : `"${k}"`;
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
