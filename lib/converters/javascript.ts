/**
 * lib/converters/javascript.ts
 *
 * JavaScript object literal & JSDoc generator.
 */

import { inferShape, type ShapeNode } from "./shape-inferer.ts";

export interface JavaScriptOptions {
  rootName?: string;
  mode?: "object" | "jsdoc";
}

export function convertJsonToJavaScript(jsonText: string, options: JavaScriptOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `// Invalid JSON input\n// ${err instanceof Error ? err.message : String(err)}`;
  }

  const rootName = options.rootName || "RootObject";
  const mode = options.mode || "jsdoc";
  const model = inferShape(parsed, rootName);

  if (mode === "object") {
    return `const ${toValidVarName(rootName)} = ${JSON.stringify(parsed, null, 2)};`;
  }

  // JSDoc Mode
  const blocks: string[] = [];

  for (const obj of model.nestedObjects) {
    const lines: string[] = [];
    lines.push("/**");
    lines.push(` * @typedef {Object} ${obj.name}`);

    for (const field of obj.fields) {
      const typeStr = shapeToJsDocType(field.type);
      const propStr = field.isOptional ? `[${field.name}]` : field.name;
      lines.push(` * @property {${typeStr}} ${propStr}`);
    }

    lines.push(" */");
    blocks.push(lines.join("\n"));
  }

  blocks.push(`const ${toValidVarName(rootName)} = ${JSON.stringify(parsed, null, 2)};`);
  return blocks.join("\n\n");
}

function shapeToJsDocType(shape: ShapeNode): string {
  switch (shape.kind) {
    case "primitive":
      switch (shape.type) {
        case "string": return "string";
        case "number": return "number";
        case "boolean": return "boolean";
        default: return "*";
      }
    case "object":
      return shape.name;
    case "array":
      return `Array<${shapeToJsDocType(shape.elementType)}>`;
    case "union":
      return shape.types.map(shapeToJsDocType).join("|");
  }
}

function toValidVarName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_$]/g, "");
  if (!clean || /^[0-9]/.test(clean)) return "data";
  return clean.charAt(0).toLowerCase() + clean.slice(1);
}
