import { test } from "node:test";
import assert from "node:assert/strict";
import { inferShape } from "./converters/shape-inferer.ts";
import { convertJsonToTypeScript } from "./converters/typescript.ts";
import { convertJsonToPython } from "./converters/python.ts";
import { convertJsonToGo } from "./converters/go.ts";
import { convertJsonToRust } from "./converters/rust.ts";
import { convertJsonToCsv } from "./converters/csv.ts";
import { convertJsonToYaml } from "./converters/yaml.ts";
import { convertJsonToXml } from "./converters/xml.ts";
import { convertJsonToToml } from "./converters/toml.ts";
import { convertJsonToSql } from "./converters/sql.ts";

const SAMPLE_JSON = JSON.stringify({
  id: 1,
  name: "Alice",
  active: true,
  tags: ["dev", "lead"],
  user_address: {
    city: "San Francisco",
    zip: 94105,
  },
});

test("shape-inferer extracts nested objects and primitive types correctly", () => {
  const parsed = JSON.parse(SAMPLE_JSON);
  const model = inferShape(parsed, "UserResponse");
  assert.equal(model.rootName, "UserResponse");
  assert.ok(model.nestedObjects.length >= 2);
});

test("JSON to TypeScript generates valid interfaces and type definitions", () => {
  const code = convertJsonToTypeScript(SAMPLE_JSON, { style: "interface", rootName: "UserResponse" });
  assert.ok(code.includes("interface UserResponse"));
  assert.ok(code.includes("id: number;"));
  assert.ok(code.includes("name: string;"));
  assert.ok(code.includes("tags: string[];"));
});

test("JSON to Python generates Pydantic v2 BaseModel classes", () => {
  const code = convertJsonToPython(SAMPLE_JSON, { mode: "pydantic", rootName: "UserResponse" });
  assert.ok(code.includes("class UserResponse(BaseModel):"));
  assert.ok(code.includes("from pydantic import BaseModel"));
});

test("JSON to Go generates struct definitions with json tags", () => {
  const code = convertJsonToGo(SAMPLE_JSON, { jsonTags: true, rootName: "UserResponse" });
  assert.ok(code.includes("type UserResponse struct"));
  assert.ok(code.includes('`json:"name"`'));
});

test("JSON to Rust generates structs with Serde annotations", () => {
  const code = convertJsonToRust(SAMPLE_JSON, { serdeDerive: true, rootName: "UserResponse" });
  assert.ok(code.includes("pub struct UserResponse"));
  assert.ok(code.includes("#[derive(Debug, Serialize, Deserialize)]"));
});

test("JSON to CSV flattens nested objects into dot notation columns", () => {
  const csv = convertJsonToCsv(SAMPLE_JSON, { flatten: true });
  assert.ok(csv.includes("user_address.city"));
  assert.ok(csv.includes("San Francisco"));
});

test("JSON to YAML, XML, TOML, and SQL produce valid output", () => {
  const yaml = convertJsonToYaml(SAMPLE_JSON);
  assert.ok(yaml.includes("name: Alice"));

  const xml = convertJsonToXml(SAMPLE_JSON);
  assert.ok(xml.includes("<name>Alice</name>"));

  const toml = convertJsonToToml(SAMPLE_JSON);
  assert.ok(toml.includes('name = "Alice"'));

  const sql = convertJsonToSql(SAMPLE_JSON, { tableName: "users" });
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS users"));
  assert.ok(sql.includes("INSERT INTO users"));
});

// ─── Edge cases found during the phase 2/3/4 audit ─────────────────────────

test("shape-inferer merges mixed-shape array elements into one object instead of one-per-element", () => {
  const json = JSON.stringify({ items: [{ a: 1 }, { a: 1, b: "x" }, { a: null }] });
  const code = convertJsonToTypeScript(json, { style: "interface", rootName: "R" });
  // Regression: used to emit Item/Item2/Item3 and reference the wrong
  // (unmerged) one from `items: Item[]`.
  assert.ok(!code.includes("Item2"), "should not emit a duplicate per-element interface");
  assert.ok(code.includes("interface Item {"));
  assert.ok(code.includes("a: number | null;"));
  assert.ok(code.includes("b?: string;"));
  assert.ok(code.includes("items: Item[];"));
});

test("shape-inferer registers object members nested inside a union (object next to null)", () => {
  const json = JSON.stringify({ items: [{ a: 1 }, null, { a: 2, c: true }] });
  const code = convertJsonToTypeScript(json, { style: "interface", rootName: "R" });
  assert.ok(code.includes("a: number;"));
  assert.ok(code.includes("c?: boolean;"));
  // Union-in-array needs parens: `Item | null[]` parses as `Item | (null[])`.
  assert.ok(code.includes("items: (Item | null)[];"));
});

test("JSON to TOML represents arrays of objects as [[array-of-tables]], not empty strings", () => {
  const json = JSON.stringify({ rows: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] });
  const toml = convertJsonToToml(json);
  assert.ok(toml.includes("[[rows]]"));
  assert.ok(toml.includes("id = 1"));
  assert.ok(toml.includes('name = "Alice"'));
  assert.ok(!toml.includes('rows = [""'), "must not silently drop array-of-object contents");
});

test("JSON to YAML preserves multi-line strings via a block scalar instead of folding them", () => {
  const json = JSON.stringify({ note: "line one\nline two" });
  const yaml = convertJsonToYaml(json);
  assert.ok(yaml.includes("note: |-"));
  assert.ok(yaml.includes("line one"));
  assert.ok(yaml.includes("line two"));
});

test("JSON to YAML quotes ambiguous scalars so they don't round-trip as the wrong type", () => {
  const json = JSON.stringify({ a: "yes", b: "123", c: "null" });
  const yaml = convertJsonToYaml(json);
  assert.ok(yaml.includes('a: "yes"'));
  assert.ok(yaml.includes('b: "123"'));
  assert.ok(yaml.includes('c: "null"'));
});
