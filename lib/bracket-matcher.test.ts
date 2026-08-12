import test from "node:test";
import assert from "node:assert/strict";
import { findMatchingBracket } from "./bracket-matcher.ts";

test("findMatchingBracket finds matching object braces", () => {
  const json = '{\n  "a": 1\n}';
  const match1 = findMatchingBracket(json, 0);
  assert.deepEqual(match1, [0, 11]);

  const match2 = findMatchingBracket(json, 11);
  assert.deepEqual(match2, [0, 11]);
});

test("findMatchingBracket finds matching array brackets", () => {
  const json = '{"list": [1, 2, 3]}';
  const openIdx = json.indexOf("[");
  const closeIdx = json.indexOf("]");

  const match = findMatchingBracket(json, openIdx + 1);
  assert.deepEqual(match, [openIdx, closeIdx]);
});

test("findMatchingBracket ignores brackets inside string literals", () => {
  const json = '{"fake": "[not a bracket]", "real": [10]}';
  const openIdx = json.lastIndexOf("[");
  const closeIdx = json.lastIndexOf("]");

  const match = findMatchingBracket(json, openIdx + 1);
  assert.deepEqual(match, [openIdx, closeIdx]);
});
