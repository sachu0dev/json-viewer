/**
 * lib/converters/csv.ts
 *
 * Tabular JSON to CSV converter (with flattening, header toggle, array explosion).
 */

export interface CsvOptions {
  flatten?: boolean;
  delimiter?: string;
  includeHeaders?: boolean;
}

export function convertJsonToCsv(jsonText: string, options: CsvOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `# Invalid JSON input\n# ${err instanceof Error ? err.message : String(err)}`;
  }

  const flatten = options.flatten ?? true;
  const delimiter = options.delimiter || ",";
  const includeHeaders = options.includeHeaders ?? true;

  // Normalize input into an array of objects
  let items: Record<string, unknown>[] = [];
  if (Array.isArray(parsed)) {
    items = parsed.map((item) => (typeof item === "object" && item !== null ? (item as Record<string, unknown>) : { value: item }));
  } else if (typeof parsed === "object" && parsed !== null) {
    items = [parsed as Record<string, unknown>];
  } else {
    items = [{ value: parsed }];
  }

  // Flatten nested objects if requested
  const processed = items.map((row) => (flatten ? flattenObject(row) : stringifyNested(row)));

  // Collect all unique column headers across rows
  const headersSet = new Set<string>();
  for (const row of processed) {
    for (const key of Object.keys(row)) {
      headersSet.add(key);
    }
  }
  const headers = Array.from(headersSet);

  if (headers.length === 0) return "";

  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter));
  }

  for (const row of processed) {
    const rowCells = headers.map((h) => {
      const val = row[h];
      if (val === undefined || val === null) return "";
      return escapeCsvCell(String(val), delimiter);
    });
    lines.push(rowCells.join(delimiter));
  }

  return lines.join("\n");
}

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    const propName = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val as Record<string, unknown>, propName));
    } else if (Array.isArray(val)) {
      result[propName] = JSON.stringify(val);
    } else {
      result[propName] = val;
    }
  }

  return result;
}

function stringifyNested(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = typeof val === "object" && val !== null ? JSON.stringify(val) : val;
  }
  return result;
}

function escapeCsvCell(cell: string, delimiter: string): string {
  if (cell.includes(delimiter) || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}
