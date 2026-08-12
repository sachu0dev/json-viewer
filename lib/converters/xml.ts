/**
 * lib/converters/xml.ts
 *
 * Lightweight JSON ↔ XML converter with element & attribute formatting.
 */

export function convertJsonToXml(jsonText: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `<!-- Invalid JSON input: ${err instanceof Error ? err.message : String(err)} -->`;
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n' + stringifyXml(parsed, 1) + "\n</root>";
}

function stringifyXml(val: unknown, depth: number): string {
  const indent = "  ".repeat(depth);

  if (val === null || val === undefined) return "";
  if (typeof val !== "object") return `${indent}${escapeXml(String(val))}`;

  if (Array.isArray(val)) {
    return val.map((item) => `${indent}<item>\n${stringifyXml(item, depth + 1)}\n${indent}</item>`).join("\n");
  }

  const lines: string[] = [];
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    const tag = sanitizeXmlTag(k);
    if (v === null || v === undefined) {
      lines.push(`${indent}<${tag}/>`);
    } else if (typeof v === "object") {
      lines.push(`${indent}<${tag}>\n${stringifyXml(v, depth + 1)}\n${indent}</${tag}>`);
    } else {
      lines.push(`${indent}<${tag}>${escapeXml(String(v))}</${tag}>`);
    }
  }

  return lines.join("\n");
}

function sanitizeXmlTag(tag: string): string {
  const clean = tag.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return /^[a-zA-Z_]/.test(clean) ? clean : `_${clean}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
