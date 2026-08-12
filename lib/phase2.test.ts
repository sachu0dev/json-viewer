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
