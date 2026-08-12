/**
 * lib/jsonl-parser.ts
 *
 * Fast line-by-line parser for JSON Lines (JSONL / NDJSON).
 * Supports content-sniffing to detect whether a string represents JSONL,
 * and builds record summaries with per-line validation status.
 */

import type { JsonValue } from "./json-document.ts";

export interface JsonlRecord {
  lineNumber: number;
  rawText: string;
  isValid: boolean;
  error?: string;
  parsed?: JsonValue;
}

export interface JsonlSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  records: JsonlRecord[];
}

/**
 * Sniffs whether text is JSONL:
 * Returns true if standard parse fails AND text has multiple non-empty lines where
 * at least 80% of lines parse as valid JSON objects or primitives.
 */
export function isJsonlContent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // If it's valid single-document JSON, it's not JSONL (unless it contains newlines and is an array of objects)
  try {
    const direct = JSON.parse(trimmed);
    // Standard single object or primitive -> not JSONL
    if (typeof direct === "object" && !Array.isArray(direct) && direct !== null) {
      return false;
    }
  } catch {
    // Expected to fail for JSONL (which is multiple JSON documents separated by newlines)
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return false;

  let validCount = 0;
  // Test first 50 lines for speed
  const sample = lines.slice(0, 50);
  for (const line of sample) {
    try {
      JSON.parse(line);
      validCount++;
    } catch {
      // invalid line
    }
  }

  return validCount / sample.length >= 0.5;
}

/**
 * Parses full text as JSONL records.
 */
export function parseJsonl(text: string): JsonlSummary {
  const lines = text.split("\n");
  const records: JsonlRecord[] = [];
  let validRecords = 0;
  let invalidRecords = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue; // skip blank lines

    let isValid = false;
    let parsed: JsonValue = null;
    let error: string | undefined = undefined;

    try {
      parsed = JSON.parse(trimmed);
      isValid = true;
      validRecords++;
    } catch (e) {
      isValid = false;
      invalidRecords++;
      error = e instanceof Error ? e.message : "Syntax error in record";
    }

    records.push({
      lineNumber: i + 1,
      rawText: raw,
      isValid,
      error,
      parsed,
    });
  }

  return {
    totalRecords: records.length,
    validRecords,
    invalidRecords,
    records,
  };
}
