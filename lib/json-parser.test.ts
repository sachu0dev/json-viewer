import assert from "node:assert";
import { test } from "node:test";
import { parseTolerantJSON, getDynamicExpandPaths } from "./json-parser.ts";

test("parseTolerantJSON parses strict valid JSON", () => {
  const input = '{"a": 1, "b": [2, 3]}';
  const result = parseTolerantJSON(input);
  assert.strictEqual(result.mode, "strict");
  assert.strictEqual(result.stringError, null);
  assert.strictEqual(result.jsEvalStatus, "success");
  assert.deepStrictEqual(result.value, { a: 1, b: [2, 3] });
});

test("parseTolerantJSON parses JS object syntax (unquoted keys, single quotes, trailing comma)", () => {
  const input = "{ name: 'Alice', age: 30, colors: ['red', 'blue',], }";
  const result = parseTolerantJSON(input);
  assert.strictEqual(result.mode, "js-eval");
  assert.notStrictEqual(result.stringError, null);
  assert.strictEqual(result.jsEvalStatus, "success");
  assert.deepStrictEqual(result.value, { name: "Alice", age: 30, colors: ["red", "blue"] });
});

test("parseTolerantJSON performs partial recovery on truncated JSON", () => {
  const input = '{"products": [{"id": 1, "title": "Essence Mascara" Unexpected...';
  const result = parseTolerantJSON(input);
  assert.ok(result.mode === "partial" || result.mode === "js-eval");
  assert.notStrictEqual(result.value, null);
  assert.notStrictEqual(result.stringError, null);
});

test("parseTolerantJSON recovers siblings around a mid-document error", () => {
  const input = '{"a": 1, "b": %%%broken%%%, "c": 3, "d": [1, 2, 3]}';
  const result = parseTolerantJSON(input);
  assert.strictEqual(result.mode, "partial");
  const value = result.value as Record<string, unknown>;
  assert.strictEqual(value.a, 1);
  assert.ok(typeof value.b === "string" && (value.b as string).startsWith("⚠"));
  assert.strictEqual(value.c, 3);
  assert.deepStrictEqual(value.d, [1, 2, 3]);
});

test("getDynamicExpandPaths expands small docs fully", () => {
  const doc = { a: { b: { c: 1 } } };
  const paths = getDynamicExpandPaths(doc);
  assert.ok(paths.has("$"));
  assert.ok(paths.has("$.a"));
  assert.ok(paths.has("$.a.b"));
});
