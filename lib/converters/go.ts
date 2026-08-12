/**
 * lib/converters/go.ts
 *
 * Go struct generator with `json:"..."` tags.
 */

import { inferShape, type ShapeNode, toPascalCase } from "./shape-inferer.ts";

export interface GoOptions {
  rootName?: string;
  jsonTags?: boolean;
}

export function convertJsonToGo(jsonText: string, options: GoOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `// Invalid JSON input\n// ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const withTags = options.jsonTags ?? true;
  const model = inferShape(parsed, rootName);

  const structs: string[] = [];

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];
    lines.push(`type ${obj.name} struct {`);

    for (const field of obj.fields) {
      const fieldName = toPascalCase(field.name);
      const goType = shapeToGoType(field.type);
      const omitempty = field.isOptional ? ",omitempty" : "";
      const tag = withTags ? ` \`json:"${field.name}${omitempty}"\`` : "";

      lines.push(`\t${fieldName} ${goType}${tag}`);
    }

    lines.push("}");
    structs.push(lines.join("\n"));
  }

  return "package main\n\n" + structs.join("\n\n");
}

function shapeToGoType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      switch (shape.type) {
        case "string": return "string";
        case "number": return "float64";
        case "boolean": return "bool";
        default: return "interface{}";
      }
    case "object":
      return shape.name;
    case "array":
      return `[]${shapeToGoType(shape.elementType)}`;
    case "union":
      return "interface{}";
  }
}
