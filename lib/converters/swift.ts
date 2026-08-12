/**
 * lib/converters/swift.ts
 *
 * Swift Codable struct generator.
 */

import { inferShape, type ShapeNode, toCamelCase } from "./shape-inferer.ts";

export interface SwiftOptions {
  rootName?: string;
}

export function convertJsonToSwift(jsonText: string, options: SwiftOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `// Invalid JSON input\n// ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const model = inferShape(parsed, rootName);

  const header = "import Foundation\n\n";
  const structs: string[] = [];

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];
    lines.push(`struct ${obj.name}: Codable {`);

    const codingKeys: [string, string][] = [];
    for (const field of obj.fields) {
      const swiftPropName = toCamelCase(field.name);
      const rawType = shapeToSwiftType(field.type);
      const swiftType = field.isOptional ? `${rawType}?` : rawType;

      lines.push(`    let ${swiftPropName}: ${swiftType}`);
      if (swiftPropName !== field.name) {
        codingKeys.push([swiftPropName, field.name]);
      }
    }

    if (codingKeys.length > 0) {
      lines.push("");
      lines.push("    enum CodingKeys: String, CodingKey {");
      for (const field of obj.fields) {
        const swiftPropName = toCamelCase(field.name);
        lines.push(`        case ${swiftPropName} = "${field.name}"`);
      }
      lines.push("    }");
    }

    lines.push("}");
    structs.push(lines.join("\n"));
  }

  return header + structs.join("\n\n");
}

function shapeToSwiftType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      switch (shape.type) {
        case "string": return "String";
        case "number": return "Double";
        case "boolean": return "Bool";
        default: return "AnyCodable";
      }
    case "object":
      return shape.name;
    case "array":
      return `[${shapeToSwiftType(shape.elementType)}]`;
    case "union":
      return "AnyCodable";
  }
}
