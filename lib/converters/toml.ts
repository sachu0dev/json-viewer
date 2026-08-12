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

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

function tomlKey(key: string): string {
  return /^[a-zA-Z0-9_\-]+$/.test(key) ? key : `"${escapeTomlString(key)}"`;
}

function stringifyTomlTable(obj: Record<string, unknown>, prefix: string): string {
  const scalars: string[] = [];
  const tables: string[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const keyStr = tomlKey(key);
    const sectionHeader = prefix ? `${prefix}.${keyStr}` : keyStr;

    if (isPlainObject(val)) {
      tables.push(`\n[${sectionHeader}]\n` + stringifyTomlTable(val, sectionHeader));
    } else if (Array.isArray(val) && val.length > 0 && val.every(isPlainObject)) {
      // Array of objects → TOML's `[[section]]` array-of-tables form, one
      // repeated block per element. A plain inline array of tables isn't
      // valid TOML, and the previous implementation silently produced `""`
      // for every element here.
      tables.push(
        val
          .map(
            (item) =>
              `\n[[${sectionHeader}]]\n` +
              stringifyTomlTable(item as Record<string, unknown>, sectionHeader)
          )
          .join("")
      );
    } else {
      scalars.push(`${keyStr} = ${stringifyTomlValue(val)}`);
    }
  }

  return scalars.join("\n") + tables.join("\n");
}

function escapeTomlString(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function stringifyTomlValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return `"${escapeTomlString(val)}"`;
  if (Array.isArray(val)) return `[${val.map(stringifyTomlValue).join(", ")}]`;
  if (isPlainObject(val)) {
    // A lone object reaching here (e.g. mixed inside a non-uniform array)
    // has no `[[section]]` slot to live in — an inline table is the closest
    // valid TOML representation.
    const entries = Object.entries(val).map(([k, v]) => `${tomlKey(k)} = ${stringifyTomlValue(v)}`);
    return `{ ${entries.join(", ")} }`;
  }
  return '""';
}
