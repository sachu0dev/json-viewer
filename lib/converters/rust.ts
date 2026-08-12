/**
 * lib/converters/rust.ts
 *
 * Rust struct generator with Serde derive annotations.
 */

import { inferShape, type ShapeNode, toSnakeCase } from "./shape-inferer.ts";

export interface RustOptions {
  rootName?: string;
  serdeDerive?: boolean;
}

export function convertJsonToRust(jsonText: string, options: RustOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `// Invalid JSON input\n// ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const serde = options.serdeDerive ?? true;
  const model = inferShape(parsed, rootName);

  const structs: string[] = [];
  if (serde) {
    structs.push("use serde::{Serialize, Deserialize};\n");
  }

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];
    if (serde) {
      lines.push("#[derive(Debug, Serialize, Deserialize)]");
    }
    lines.push(`pub struct ${obj.name} {`);

    for (const field of obj.fields) {
      const rustFieldName = toSnakeCase(field.name);
      const rawType = shapeToRustType(field.type);
      const rustType = field.isOptional ? `Option<${rawType}>` : rawType;

      if (serde && rustFieldName !== field.name) {
        lines.push(`    #[serde(rename = "${field.name}")]`);
      }
      lines.push(`    pub ${rustFieldName}: ${rustType},`);
    }

    lines.push("}");
    structs.push(lines.join("\n"));
  }

  return structs.join("\n\n");
}

function shapeToRustType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      switch (shape.type) {
        case "string": return "String";
        case "number": return "f64";
        case "boolean": return "bool";
        default: return "serde_json::Value";
      }
    case "object":
      return shape.name;
    case "array":
      return `Vec<${shapeToRustType(shape.elementType)}>`;
    case "union":
      return "serde_json::Value";
  }
}
