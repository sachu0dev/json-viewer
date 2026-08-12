import { test } from "node:test";
import assert from "node:assert/strict";
import { ancestorsOf, buildFlatRows, diffDocuments, searchDocument } from "./json-document.ts";

test("collapsed root shows only itself", () => {
  const rows = buildFlatRows({ a: 1, b: [2, 3] }, new Set());
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, "$");
  assert.equal(rows[0].hasChildren, true);
});

test("expanding root reveals children with path identity", () => {
  const rows = buildFlatRows({ a: 1, b: [2, 3] }, new Set(["$"]));
  assert.deepEqual(
    rows.map((r) => r.path),
    ["$", "$.a", "$.b"],
  );
});

test("expanding a nested array reveals indexed paths", () => {
  const rows = buildFlatRows({ a: 1, b: [2, 3] }, new Set(["$", "$.b"]));
  assert.deepEqual(
    rows.map((r) => r.path),
    ["$", "$.a", "$.b", "$.b[0]", "$.b[1]"],
  );
});

test("ancestorsOf returns strict, root-first ancestors", () => {
  assert.deepEqual(ancestorsOf("$"), []);
  assert.deepEqual(ancestorsOf("$.b"), ["$"]);
  assert.deepEqual(ancestorsOf("$.b[0].c"), ["$", "$.b", "$.b[0]"]);
});

test("searchDocument finds a buried leaf value without it being expanded", () => {
  const doc = { a: { b: { c: "needle-value" } }, d: [1, 2, "no match here"] };
  assert.deepEqual(searchDocument(doc, "needle"), ["$.a.b.c"]);
});

test("searchDocument matches a key name and does not also recurse into it", () => {
  const doc = { needleKey: { inner: "irrelevant" }, other: "needle-again" };
  assert.deepEqual(searchDocument(doc, "needle"), ["$.needleKey", "$.other"]);
});

test("diffDocuments finds added, removed, and changed leaves", () => {
  const a = { name: "old", removedKey: 1, nested: { x: 1 } };
  const b = { name: "new", addedKey: 2, nested: { x: 1 } };
  const entries = diffDocuments(a, b);
  assert.deepEqual(
    entries.sort((x, y) => x.path.localeCompare(y.path)),
    [
      { path: "$.addedKey", status: "added", after: "2" },
      { path: "$.name", status: "changed", before: '"old"', after: '"new"' },
      { path: "$.removedKey", status: "removed", before: "1" },
    ],
  );
});

test("diffDocuments treats an unchanged nested object as no entries", () => {
  const shared = { deeply: { nested: { value: true } } };
  assert.deepEqual(diffDocuments(shared, structuredClone(shared)), []);
});

test("diffDocuments reports a type change as a single changed entry, not a recurse", () => {
  const entries = diffDocuments({ a: { x: 1 } }, { a: [1] });
  assert.deepEqual(entries, [{ path: "$.a", status: "changed", before: "{ 1 key }", after: "[ 1 item ]" }]);
});
