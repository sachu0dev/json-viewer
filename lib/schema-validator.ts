import Ajv, { type ErrorObject } from "ajv";
import Ajv2019 from "ajv/dist/2019.js";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export type SchemaDraft = "auto" | "draft-07" | "2019-09" | "2020-12";

export interface SchemaValidationError {
  path: string;
  message: string;
  keyword: string;
  schemaPath: string;
  params?: Record<string, unknown>;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
  parseError?: string;
  /** The draft actually used to compile the schema — relevant when draftVersion is "auto". */
  draftUsed?: Exclude<SchemaDraft, "auto">;
}

/** Detects a draft from a schema's own `$schema` URI. Falls back to draft-07, the most common in the wild. */
export function detectDraft(schema: unknown): Exclude<SchemaDraft, "auto"> {
  const id = typeof schema === "object" && schema !== null ? (schema as Record<string, unknown>).$schema : undefined;
  if (typeof id === "string") {
    if (id.includes("2020-12")) return "2020-12";
    if (id.includes("2019-09")) return "2019-09";
  }
  return "draft-07";
}

function createAjvInstance(draft: Exclude<SchemaDraft, "auto">): Ajv {
  const opts = { allErrors: true, verbose: true, strict: false };
  const ajv =
    draft === "2020-12" ? new Ajv2020(opts) : draft === "2019-09" ? new Ajv2019(opts) : new Ajv(opts);
  addFormats(ajv as unknown as Ajv);
  return ajv as unknown as Ajv;
}

/**
 * Formats Ajv errors into clean human-readable objects per spec (§10).
 * Example output:
 * path: "/users/0/email"
 * message: "Expected string, received number"
 */
function formatAjvErrors(errors: ErrorObject[] | null | undefined): SchemaValidationError[] {
  if (!errors || errors.length === 0) return [];

  return errors.map((err) => {
    const instancePath = err.instancePath || "/";
    let humanMessage = err.message || "Invalid schema property";
    const params = err.params as Record<string, unknown>;

    switch (err.keyword) {
      case "type":
        humanMessage = `Expected ${params?.type}, received ${describeReceived(err.data)}`;
        break;
      case "required":
        humanMessage = `Missing required property: '${params?.missingProperty}'`;
        break;
      case "enum":
        humanMessage = `Value must be one of: ${JSON.stringify(params?.allowedValues)}`;
        break;
      case "additionalProperties":
        humanMessage = `Unexpected additional property: '${params?.additionalProperty}'`;
        break;
      case "pattern":
        humanMessage = `Value does not match required pattern: ${params?.pattern}`;
        break;
      case "format":
        humanMessage = `Value is not a valid '${params?.format}' — ${err.message ?? "format check failed"}`;
        break;
      case "minimum":
        humanMessage = `Must be >= ${params?.limit} (received ${JSON.stringify(err.data)})`;
        break;
      case "maximum":
        humanMessage = `Must be <= ${params?.limit} (received ${JSON.stringify(err.data)})`;
        break;
      case "exclusiveMinimum":
        humanMessage = `Must be strictly greater than ${params?.limit} (received ${JSON.stringify(err.data)})`;
        break;
      case "exclusiveMaximum":
        humanMessage = `Must be strictly less than ${params?.limit} (received ${JSON.stringify(err.data)})`;
        break;
      case "minLength":
        humanMessage = `Must be at least ${params?.limit} characters (got ${typeof err.data === "string" ? err.data.length : "?"})`;
        break;
      case "maxLength":
        humanMessage = `Must be at most ${params?.limit} characters (got ${typeof err.data === "string" ? err.data.length : "?"})`;
        break;
      case "minItems":
        humanMessage = `Array must contain at least ${params?.limit} item(s)`;
        break;
      case "maxItems":
        humanMessage = `Array must contain at most ${params?.limit} item(s)`;
        break;
      case "minProperties":
        humanMessage = `Object must have at least ${params?.limit} propert${params?.limit === 1 ? "y" : "ies"}`;
        break;
      case "maxProperties":
        humanMessage = `Object must have at most ${params?.limit} propert${params?.limit === 1 ? "y" : "ies"}`;
        break;
      case "uniqueItems":
        humanMessage = `Array items must be unique — duplicate found at index ${params?.j}`;
        break;
      case "const":
        humanMessage = `Value must exactly equal: ${JSON.stringify(params?.allowedValue)}`;
        break;
      case "multipleOf":
        humanMessage = `Must be a multiple of ${params?.multipleOf}`;
        break;
      case "not":
        humanMessage = `Value must NOT match the excluded schema at ${err.schemaPath}`;
        break;
      case "oneOf": {
        const passingCount = (params?.passingSchemas as unknown[] | undefined)?.length ?? 0;
        humanMessage = `Value must match exactly one of the allowed schemas (matched ${passingCount})`;
        break;
      }
      case "anyOf":
        humanMessage = `Value does not match any of the allowed schemas`;
        break;
      case "dependentRequired":
      case "dependencies":
        humanMessage = `Missing property required alongside '${params?.property}': '${params?.missingProperty ?? ""}'`;
        break;
      case "propertyNames":
        humanMessage = `Property name is invalid: '${params?.propertyName ?? ""}'`;
        break;
      default:
        break;
    }

    return {
      path: instancePath,
      message: humanMessage,
      keyword: err.keyword || "validation",
      schemaPath: err.schemaPath || "#",
      params: err.params,
    };
  });
}

function describeReceived(data: unknown): string {
  if (data === undefined) return "undefined";
  if (data === null) return "null";
  if (Array.isArray(data)) return "array";
  return typeof data;
}

/**
 * Validates a target JSON document against a JSON Schema document.
 * draftVersion "auto" (default) picks the draft from the schema's own
 * `$schema` URI; pass an explicit draft to force compilation against it
 * regardless of what `$schema` says.
 */
export function validateJsonSchema(
  dataInput: string | object,
  schemaInput: string | object,
  draftVersion: SchemaDraft = "auto"
): SchemaValidationResult {
  let parsedData: unknown;
  let parsedSchema: unknown;

  // 1. Parse Data
  if (typeof dataInput === "string") {
    try {
      parsedData = JSON.parse(dataInput);
    } catch (err) {
      return {
        valid: false,
        errors: [],
        parseError: `JSON Data parse error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  } else {
    parsedData = dataInput;
  }

  // 2. Parse Schema
  if (typeof schemaInput === "string") {
    try {
      parsedSchema = JSON.parse(schemaInput);
    } catch (err) {
      return {
        valid: false,
        errors: [],
        parseError: `JSON Schema parse error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  } else {
    parsedSchema = schemaInput;
  }

  if (typeof parsedSchema !== "object" || parsedSchema === null) {
    return {
      valid: false,
      errors: [],
      parseError: "Schema must be a valid JSON object or boolean schema.",
    };
  }

  const draftUsed = draftVersion === "auto" ? detectDraft(parsedSchema) : draftVersion;

  // 3. Validate with Ajv
  try {
    const ajv = createAjvInstance(draftUsed);
    const validate = ajv.compile(parsedSchema as object);
    const valid = validate(parsedData);

    if (valid) {
      return { valid: true, errors: [], draftUsed };
    }

    return {
      valid: false,
      errors: formatAjvErrors(validate.errors),
      draftUsed,
    };
  } catch (err) {
    return {
      valid: false,
      errors: [],
      parseError: `Schema compilation error (${draftUsed}): ${err instanceof Error ? err.message : String(err)}`,
      draftUsed,
    };
  }
}

// ─── Infer a JSON Schema from a sample document ────────────────────────────
//
// Not a full type-system inferrer (that's lib/converters/shape-inferer.ts's
// job for code generators) — this stays schema-shaped: object/array/
// primitive nodes with `required` computed from key presence across
// merged array items, because that's what's actually useful to hand-edit
// into a working schema, not a maximally precise type.

export interface InferSchemaResult {
  schema: Record<string, unknown> | null;
  error?: string;
}

export function inferSchemaFromJson(jsonText: string): InferSchemaResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return { schema: null, error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}` };
  }

  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...inferSchemaNode(parsed),
  };
  return { schema };
}

function inferSchemaNode(value: unknown): Record<string, unknown> {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array" };
    const itemSchemas = value.map(inferSchemaNode);
    return { type: "array", items: mergeSchemaNodes(itemSchemas) };
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const properties: Record<string, unknown> = {};
    for (const [key, v] of entries) properties[key] = inferSchemaNode(v);
    return {
      type: "object",
      properties,
      required: entries.map(([key]) => key),
    };
  }
  if (typeof value === "string") return { type: "string" };
  if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
  if (typeof value === "boolean") return { type: "boolean" };
  return {};
}

/** Merges sibling schema nodes (typically array items) into one representative schema. */
function mergeSchemaNodes(nodes: Record<string, unknown>[]): Record<string, unknown> {
  const unique: Record<string, unknown>[] = [];
  for (const n of nodes) {
    if (!unique.some((u) => JSON.stringify(u) === JSON.stringify(n))) unique.push(n);
  }
  if (unique.length === 1) return unique[0];

  const allObjects = unique.every((n) => n.type === "object");
  if (allObjects) {
    const propertyOccurrences = new Map<string, Record<string, unknown>[]>();
    for (const obj of unique) {
      const props = (obj.properties as Record<string, unknown>) ?? {};
      for (const [key, propSchema] of Object.entries(props)) {
        if (!propertyOccurrences.has(key)) propertyOccurrences.set(key, []);
        propertyOccurrences.get(key)!.push(propSchema as Record<string, unknown>);
      }
    }
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, schemas] of propertyOccurrences.entries()) {
      properties[key] = mergeSchemaNodes(schemas);
      if (schemas.length === unique.length) required.push(key);
    }
    return { type: "object", properties, required };
  }

  const allPrimitiveTypes = unique.every((n) => typeof n.type === "string" && n.type !== "object" && n.type !== "array");
  if (allPrimitiveTypes) {
    const types = Array.from(new Set(unique.map((n) => n.type as string)));
    return types.length === 1 ? { type: types[0] } : { type: types };
  }

  // Genuinely mixed shapes (objects alongside primitives/arrays) — anyOf is
  // the honest representation rather than picking one and dropping the rest.
  return { anyOf: unique };
}
