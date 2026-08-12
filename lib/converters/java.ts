/**
 * lib/converters/java.ts
 *
 * Java record / class generator with Jackson annotations.
 */

import { inferShape, type ShapeNode, toCamelCase } from "./shape-inferer.ts";

export interface JavaOptions {
  rootName?: string;
  mode?: "record" | "class";
}

export function convertJsonToJava(jsonText: string, options: JavaOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `// Invalid JSON input\n// ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const mode = options.mode || "record";
  const model = inferShape(parsed, rootName);

  const header = "import com.fasterxml.jackson.annotation.JsonProperty;\nimport java.util.List;\n\n";
  const classes: string[] = [];

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];

    if (mode === "record") {
      lines.push(`public record ${obj.name}(`);
      const fieldLines: string[] = [];
      for (const field of obj.fields) {
        const fieldName = toCamelCase(field.name);
        const javaType = shapeToJavaType(field.type);
        fieldLines.push(`    @JsonProperty("${field.name}") ${javaType} ${fieldName}`);
      }
      lines.push(fieldLines.join(",\n"));
      lines.push(") {}");
    } else {
      lines.push(`public class ${obj.name} {`);
      for (const field of obj.fields) {
        const fieldName = toCamelCase(field.name);
        const javaType = shapeToJavaType(field.type);
        lines.push(`    @JsonProperty("${field.name}")`);
        lines.push(`    private ${javaType} ${fieldName};`);
      }
      lines.push("}");
    }

    classes.push(lines.join("\n"));
  }

  return header + classes.join("\n\n");
}

function shapeToJavaType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      switch (shape.type) {
        case "string": return "String";
        case "number": return "Double";
        case "boolean": return "Boolean";
        default: return "Object";
      }
    case "object":
      return shape.name;
    case "array":
      return `List<${shapeToJavaType(shape.elementType)}>`;
    case "union":
      return "Object";
  }
}
