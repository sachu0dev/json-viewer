/**
 * lib/converters/typescript.ts
 *
 * TypeScript code generator (Interfaces / Type aliases).
 */

import { inferShape, type ShapeNode, isSafeIdentifier } from "./shape-inferer.ts";

export interface TypeScriptOptions {
  rootName?: string;
  style?: "interface" | "type";
  exportKeyword?: boolean;
  readOnly?: boolean;
  optionalProps?: boolean;
}

export function convertJsonToTypeScript(jsonText: string, options: TypeScriptOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `// Invalid JSON input\n// ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const style = options.style || "interface";
  const useExport = options.exportKeyword ?? true;
  const isReadOnly = options.readOnly ?? false;

  const model = inferShape(parsed, rootName);
  const codeBlocks: string[] = [];

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];
    const prefix = useExport ? "export " : "";

    if (style === "interface") {
      lines.push(`${prefix}interface ${obj.name} {`);
    } else {
      lines.push(`${prefix}type ${obj.name} = {`);
    }

    for (const field of obj.fields) {
      const propKey = isSafeIdentifier(field.name) ? field.name : `"${field.name}"`;
      const opt = field.isOptional ? "?" : "";
      const ro = isReadOnly ? "readonly " : "";
      const typeStr = shapeToTsType(field.type);

      lines.push(`  ${ro}${propKey}${opt}: ${typeStr};`);
    }

    lines.push(style === "interface" ? "}" : "};");
    codeBlocks.push(lines.join("\n"));
  }

  if (codeBlocks.length === 0) {
    const rootType = shapeToTsType(model.rootShape);
    const prefix = useExport ? "export " : "";
    return `${prefix}type ${model.rootName} = ${rootType};`;
  }

  return codeBlocks.join("\n\n");
}

function shapeToTsType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      return shape.type === "null" ? "null" : shape.type;
    case "object":
      return shape.name;
    case "array":
      return `${shapeToTsType(shape.elementType)}[]`;
    case "union":
      return shape.types.map(shapeToTsType).join(" | ");
  }
}
