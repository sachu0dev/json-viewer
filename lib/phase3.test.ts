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
