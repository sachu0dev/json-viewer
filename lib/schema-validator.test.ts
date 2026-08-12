import { describe, it } from "node:test";
import assert from "node:assert";
import { validateJsonSchema, inferSchemaFromJson, detectDraft } from "./schema-validator.ts";

interface LooseSchema {
  type?: string;
  properties?: Record<string, LooseSchema>;
  items?: LooseSchema;
  required?: string[];
}

describe("validateJsonSchema", () => {
  const sampleSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["name", "email", "age"],
    properties: {
      name: { type: "string" },
      email: { type: "string", format: "email" },
      age: { type: "number", minimum: 0 },
      skills: {
        type: "array",
        items: { type: "string" },
      },
    },
  };

  it("validates compliant JSON data against schema", () => {
    const data = {
      name: "Alice",
      email: "alice@example.com",
      age: 30,
      skills: ["TypeScript", "React"],
    };

    const res = validateJsonSchema(data, sampleSchema);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.errors.length, 0);
  });

  it("returns formatted errors when types mismatch", () => {
    const invalidData = {
      name: "Alice",
      email: "alice@example.com",
      age: "thirty", // Should be number
      skills: ["TypeScript"],
    };

    const res = validateJsonSchema(invalidData, sampleSchema);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.errors.length, 1);
    assert.strictEqual(res.errors[0].path, "/age");
    assert.ok(res.errors[0].message.includes("Expected number"));
  });

  it("reports missing required properties", () => {
    const incompleteData = {
      name: "Alice",
    };

    const res = validateJsonSchema(incompleteData, sampleSchema);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some((e) => e.message.includes("Missing required property")));
  });

  it("handles malformed JSON schema inputs gracefully", () => {
    const res = validateJsonSchema({}, "{ invalid json schema");
    assert.strictEqual(res.valid, false);
    assert.ok(res.parseError?.includes("Schema parse error"));
  });

  it("auto-detects and compiles a 2020-12 schema (prefixItems)", () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { coords: { type: "array", prefixItems: [{ type: "number" }, { type: "number" }] } },
    };
    const ok = validateJsonSchema({ coords: [1, 2] }, schema);
    assert.strictEqual(ok.valid, true);
    assert.strictEqual(ok.draftUsed, "2020-12");

    const bad = validateJsonSchema({ coords: ["x", 2] }, schema);
    assert.strictEqual(bad.valid, false);
    assert.strictEqual(bad.errors[0].path, "/coords/0");
  });

  it("auto-detects and compiles a 2019-09 schema", () => {
    const schema = { $schema: "https://json-schema.org/draft/2019-09/schema#", type: "object", required: ["a"] };
    const res = validateJsonSchema({}, schema);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.draftUsed, "2019-09");
  });

  it("detectDraft falls back to draft-07 when $schema is absent or unrecognized", () => {
    assert.strictEqual(detectDraft({}), "draft-07");
    assert.strictEqual(detectDraft({ $schema: "http://json-schema.org/draft-07/schema#" }), "draft-07");
  });

  it("humanizes pattern, format, minimum, and uniqueItems errors", () => {
    const schema = {
      type: "object",
      properties: {
        sku: { type: "string", pattern: "^[A-Z]{3}$" },
        email: { type: "string", format: "email" },
        n: { type: "number", minimum: 5 },
        tags: { type: "array", uniqueItems: true },
      },
    };
    const res = validateJsonSchema({ sku: "ab", email: "nope", n: 1, tags: ["a", "a"] }, schema);
    assert.strictEqual(res.valid, false);
    const byPath = Object.fromEntries(res.errors.map((e) => [e.path, e.message]));
    assert.ok(byPath["/sku"].includes("does not match required pattern"));
    assert.ok(byPath["/email"].includes("not a valid 'email'"));
    assert.ok(byPath["/n"].includes("Must be >= 5"));
    assert.ok(byPath["/tags"].includes("must be unique"));
  });

  it("infers a schema from a JSON sample, merging required across array items", () => {
    const { schema } = inferSchemaFromJson(JSON.stringify({ id: 1, items: [{ x: 1 }, { x: 2, y: "s" }] }));
    assert.ok(schema);
    const properties = schema.properties as Record<string, LooseSchema>;
    assert.deepStrictEqual(properties.id, { type: "integer" });
    const itemSchema = properties.items.items as LooseSchema;
    assert.deepStrictEqual(itemSchema.required, ["x"]);
    assert.ok(itemSchema.properties?.y);

    // The inferred schema should itself validate the sample it came from.
    const check = validateJsonSchema(JSON.stringify({ id: 1, items: [{ x: 1 }, { x: 2, y: "s" }] }), schema!);
    assert.strictEqual(check.valid, true);
  });

  it("infer reports a parse error for invalid JSON instead of throwing", () => {
    const { schema, error } = inferSchemaFromJson("{ not json");
    assert.strictEqual(schema, null);
    assert.ok(error?.includes("JSON parse error"));
  });
});
