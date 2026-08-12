/**
 * lib/converters/toml.ts
 *
 * Lightweight JSON → TOML converter.
 */

export function convertJsonToToml(jsonText: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `# Invalid JSON input\n# ${err instanceof Error ? err.message : String(err)}`;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "# TOML requires a top-level object/table.";
  }

  return stringifyTomlTable(parsed as Record<string, unknown>, "");
}

function stringifyTomlTable(obj: Record<string, unknown>, prefix: string): string {
  const scalars: string[] = [];
  const tables: string[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const keyStr = /^[a-zA-Z0-9_\-]+$/.test(key) ? key : `"${key}"`;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      const sectionHeader = prefix ? `${prefix}.${keyStr}` : keyStr;
      tables.push(`\n[${sectionHeader}]\n` + stringifyTomlTable(val as Record<string, unknown>, sectionHeader));
    } else {
      scalars.push(`${keyStr} = ${stringifyTomlValue(val)}`);
    }
  }

  return scalars.join("\n") + tables.join("\n");
}

function stringifyTomlValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
  if (Array.isArray(val)) return `[${val.map(stringifyTomlValue).join(", ")}]`;
  return '""';
}
