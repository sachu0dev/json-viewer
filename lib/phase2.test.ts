import { test } from "node:test";
import assert from "node:assert/strict";
import { executeJsonPath } from "./jsonpath.ts";
import { repairJson } from "./json-repair.ts";
import { isJsonlContent, parseJsonl } from "./jsonl-parser.ts";

test("executeJsonPath queries JSON objects correctly", () => {
  const doc = {
    users: [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ],
  };

  const res1 = executeJsonPath(doc, "$.users[*].email");
  assert.equal(res1.error, null);
  assert.equal(res1.results.length, 2);
  assert.equal(res1.results[0].value, "alice@example.com");

  const res2 = executeJsonPath(doc, "$..name");
  assert.equal(res2.results.length, 2);
  assert.equal(res2.results[1].value, "Bob");
});

test("executeJsonPath caps results at 500 and reports truncation without an off-by-one", () => {
  const doc = { items: Array.from({ length: 501 }, (_, i) => i) };
  const res = executeJsonPath(doc, "$.items[*]");
  assert.equal(res.results.length, 500);
  assert.equal(res.truncated, true, "501 matches should report truncated");

  const exact = executeJsonPath({ items: Array.from({ length: 500 }, (_, i) => i) }, "$.items[*]");
  assert.equal(exact.results.length, 500);
  assert.equal(exact.truncated, false, "exactly 500 matches must not be flagged as truncated");
});

test("repairJson fixes trailing commas, unquoted keys, single quotes, and Python literals", () => {
  const malformed = `{
    'name': 'Alice',
    age: 30,
    active: True,
    skills: ["React", "Node",],
  }`;

  const res = repairJson(malformed);
  assert.equal(res.isValid, true);
  assert.ok(res.changes.length >= 3);
  assert.equal((res.doc as { name: string }).name, "Alice");
  assert.equal((res.doc as { active: boolean }).active, true);
});

test("isJsonlContent & parseJsonl detect and validate line-delimited records", () => {
  const jsonlText = `{"id": 1, "name": "Alice"}
{"id": 2, "name": "Bob"}
{"id": 3, invalid: syntax}`;

  assert.equal(isJsonlContent(jsonlText), true);

  const summary = parseJsonl(jsonlText);
  assert.equal(summary.totalRecords, 3);
  assert.equal(summary.validRecords, 2);
  assert.equal(summary.invalidRecords, 1);
  assert.equal(summary.records[0].isValid, true);
  assert.equal(summary.records[2].isValid, false);
});

test("path editing functions mutate document structures cleanly", async () => {
  const { updateNodeValueAtPath, renameNodeKeyAtPath, deleteNodeAtPath } = await import("./json-document.ts");
  const doc = {
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
    settings: { theme: "dark" },
  };

  type TestDoc = { users: { name: string }[]; settings: { themeId?: string; theme?: string } };

  // Update value
  const doc1 = updateNodeValueAtPath(doc, "$.users[0].name", "Alice Wonder") as unknown as TestDoc;
  assert.equal(doc1.users[0].name, "Alice Wonder");

  // Rename key
  const doc2 = renameNodeKeyAtPath(doc, "$.settings.theme", "themeId") as unknown as TestDoc;
  assert.equal(doc2.settings.themeId, "dark");
  assert.equal(doc2.settings.theme, undefined);

  // Delete node
  const doc3 = deleteNodeAtPath(doc, "$.users[1]") as unknown as TestDoc;
  assert.equal(doc3.users.length, 1);
});
