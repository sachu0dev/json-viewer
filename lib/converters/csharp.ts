/**
 * lib/converters/csharp.ts
 *
 * C# Record / Class generator with System.Text.Json attributes.
 */

import { inferShape, type ShapeNode, toPascalCase } from "./shape-inferer.ts";

export interface CSharpOptions {
  rootName?: string;
  mode?: "record" | "class";
}

export function convertJsonToCSharp(jsonText: string, options: CSharpOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `// Invalid JSON input\n// ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const mode = options.mode || "record";
  const model = inferShape(parsed, rootName);

  const header = "using System.Text.Json.Serialization;\nusing System.Collections.Generic;\n\n";
  const classes: string[] = [];

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];

    if (mode === "record") {
      lines.push(`public record ${obj.name}(`);
      const fieldLines: string[] = [];
      for (const field of obj.fields) {
        const propName = toPascalCase(field.name);
        const csType = shapeToCsType(field.type);
        fieldLines.push(`    [property: JsonPropertyName("${field.name}")] ${csType} ${propName}`);
      }
      lines.push(fieldLines.join(",\n"));
      lines.push(");");
    } else {
      lines.push(`public class ${obj.name}`);
      lines.push("{");
      for (const field of obj.fields) {
        const propName = toPascalCase(field.name);
        const csType = shapeToCsType(field.type);
        lines.push(`    [JsonPropertyName("${field.name}")]`);
        lines.push(`    public ${csType} ${propName} { get; set; }`);
      }
      lines.push("}");
    }

    classes.push(lines.join("\n"));
  }

  return header + classes.join("\n\n");
}

function shapeToCsType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      switch (shape.type) {
        case "string": return "string";
        case "number": return "double";
        case "boolean": return "bool";
        default: return "object";
      }
    case "object":
      return shape.name;
    case "array":
      return `List<${shapeToCsType(shape.elementType)}>`;
    case "union":
      return "object";
  }
}
