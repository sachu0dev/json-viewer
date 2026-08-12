/**
 * lib/converters/python.ts
 *
 * Python code generator (Pydantic v2 / dataclass / TypedDict).
 */

import { inferShape, type ShapeNode, toSnakeCase } from "./shape-inferer.ts";

export interface PythonOptions {
  rootName?: string;
  mode?: "pydantic" | "dataclass" | "typeddict";
}

export function convertJsonToPython(jsonText: string, options: PythonOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `# Invalid JSON input\n# ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const mode = options.mode || "pydantic";
  const model = inferShape(parsed, rootName);

  const header: string[] = [];
  if (mode === "pydantic") {
    header.push("from pydantic import BaseModel, Field");
    header.push("from typing import Optional, List, Any, Union\n");
  } else if (mode === "dataclass") {
    header.push("from dataclasses import dataclass");
    header.push("from typing import Optional, List, Any, Union\n");
  } else {
    header.push("from typing import TypedDict, Optional, List, Any, Union\n");
  }

  const classes: string[] = [];

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];
    if (mode === "pydantic") {
      lines.push(`class ${obj.name}(BaseModel):`);
    } else if (mode === "dataclass") {
      lines.push("@dataclass");
      lines.push(`class ${obj.name}:`);
    } else {
      lines.push(`class ${obj.name}(TypedDict, total=False):`);
    }

    if (obj.fields.length === 0) {
      lines.push("    pass");
    } else {
      for (const field of obj.fields) {
        const pyFieldName = toSnakeCase(field.name);
        const pyType = shapeToPyType(field.type);
        const typeAnnotation = field.isOptional ? `Optional[${pyType}]` : pyType;

        if (mode === "pydantic" && pyFieldName !== field.name) {
          lines.push(`    ${pyFieldName}: ${typeAnnotation} = Field(alias="${field.name}")`);
        } else {
          lines.push(`    ${pyFieldName}: ${typeAnnotation}`);
        }
      }
    }

    classes.push(lines.join("\n"));
  }

  return header.join("\n") + classes.join("\n\n");
}

function shapeToPyType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      switch (shape.type) {
        case "string": return "str";
        case "number": return "float";
        case "boolean": return "bool";
        case "null": return "None";
        default: return "Any";
      }
    case "object":
      return shape.name;
    case "array":
      return `List[${shapeToPyType(shape.elementType)}]`;
    case "union":
      return `Union[${shape.types.map(shapeToPyType).join(", ")}]`;
  }
}
