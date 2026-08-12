/**
 * lib/converters/shape-inferer.ts
 *
 * Core Intermediate Representation (IR) inference engine for code generators.
 * Analyzes arbitrary JSON values to extract type shapes, merge array element schemas,
 * detect optional properties, handle union types, and produce clean type trees.
 */

export type PrimitiveType = "string" | "number" | "boolean" | "null" | "any";

export interface FieldShape {
  name: string;
  type: ShapeNode;
  isOptional: boolean;
}

export interface ObjectShape {
  kind: "object";
  name: string;
  fields: FieldShape[];
}

export interface ArrayShape {
  kind: "array";
  elementType: ShapeNode;
}

export interface UnionShape {
  kind: "union";
  types: ShapeNode[];
}

export interface PrimitiveShape {
  kind: "primitive";
  type: PrimitiveType;
}

export type ShapeNode = ObjectShape | ArrayShape | UnionShape | PrimitiveShape;

export interface InferredModel {
  rootName: string;
  rootShape: ShapeNode;
  /** All extracted nested object shapes in topological order */
  nestedObjects: ObjectShape[];
}

// ─── Name Formatting Helpers ──────────────────────────────────────────────────

export function toPascalCase(str: string): string {
  if (!str) return "Root";
  // Strip non-alphanumeric except space/dash/underscore
  const clean = str.replace(/[^a-zA-Z0-9_\-\s]/g, "");
  return clean
    .split(/[\s_\-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") || "Root";
}

export function toSnakeCase(str: string): string {
  if (!str) return "root";
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase()
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function isSafeIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

// ─── Shape Inference Implementation ───────────────────────────────────────────

export function inferShape(value: unknown, rootName = "RootObject"): InferredModel {
  const nestedObjects: ObjectShape[] = [];
  const rootShape = walkValue(value, rootName, nestedObjects);

  return {
    rootName: toPascalCase(rootName),
    rootShape,
    nestedObjects: deduplicateAndOrderObjects(nestedObjects),
  };
}

function walkValue(value: unknown, suggestedName: string, collected: ObjectShape[]): ShapeNode {
  if (value === null || value === undefined) {
    return { kind: "primitive", type: "null" };
  }

  if (typeof value === "string") return { kind: "primitive", type: "string" };
  if (typeof value === "number") return { kind: "primitive", type: "number" };
  if (typeof value === "boolean") return { kind: "primitive", type: "boolean" };

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { kind: "array", elementType: { kind: "primitive", type: "any" } };
    }

    const elementShapes = value.map((item, idx) =>
      walkValue(item, singularize(suggestedName) + (idx > 0 ? `${idx + 1}` : ""), collected)
    );

    const merged = mergeShapes(elementShapes, singularize(suggestedName), collected);
    return { kind: "array", elementType: merged };
  }

  if (typeof value === "object") {
    const rawObj = value as Record<string, unknown>;
    const fields: FieldShape[] = [];

    for (const [key, val] of Object.entries(rawObj)) {
      const childName = toPascalCase(key);
      const childShape = walkValue(val, childName, collected);
      fields.push({
        name: key,
        type: childShape,
        isOptional: false,
      });
    }

    const objShape: ObjectShape = {
      kind: "object",
      name: toPascalCase(suggestedName),
      fields,
    };

    collected.push(objShape);
    return objShape;
  }

  return { kind: "primitive", type: "any" };
}

function mergeShapes(shapes: ShapeNode[], suggestedName: string, collected: ObjectShape[]): ShapeNode {
  if (shapes.length === 0) return { kind: "primitive", type: "any" };
  if (shapes.length === 1) return shapes[0];

  // Group by kind
  const objects = shapes.filter((s): s is ObjectShape => s.kind === "object");
  const primitives = shapes.filter((s): s is PrimitiveShape => s.kind === "primitive");

  // If all elements are objects, merge object fields
  if (objects.length === shapes.length) {
    return mergeObjectShapes(objects, suggestedName, collected);
  }

  // Deduplicate unique primitives
  const uniquePrimTypes = Array.from(new Set(primitives.map((p) => p.type)));
  if (uniquePrimTypes.length === 1 && shapes.length === primitives.length) {
    return primitives[0];
  }

  // Create union of unique shape kinds
  const distinct: ShapeNode[] = [];
  for (const s of shapes) {
    if (!distinct.some((existing) => areShapesEquivalent(existing, s))) {
      distinct.push(s);
    }
  }

  if (distinct.length === 1) return distinct[0];
  return { kind: "union", types: distinct };
}

function mergeObjectShapes(objects: ObjectShape[], suggestedName: string, collected: ObjectShape[]): ObjectShape {
  const fieldOccurrences = new Map<string, ShapeNode[]>();
  const totalObjects = objects.length;

  for (const obj of objects) {
    for (const f of obj.fields) {
      if (!fieldOccurrences.has(f.name)) fieldOccurrences.set(f.name, []);
      fieldOccurrences.get(f.name)!.push(f.type);
    }
  }

  const mergedFields: FieldShape[] = [];
  for (const [fieldName, childTypes] of fieldOccurrences.entries()) {
    const isOptional = childTypes.length < totalObjects;
    const mergedChildShape = mergeShapes(childTypes, toPascalCase(fieldName), collected);
    mergedFields.push({
      name: fieldName,
      type: mergedChildShape,
      isOptional,
    });
  }

  const mergedObj: ObjectShape = {
    kind: "object",
    name: toPascalCase(suggestedName),
    fields: mergedFields,
  };

  collected.push(mergedObj);
  return mergedObj;
}

function areShapesEquivalent(a: ShapeNode, b: ShapeNode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "primitive" && b.kind === "primitive") return a.type === b.type;
  if (a.kind === "object" && b.kind === "object") return a.name === b.name;
  return true;
}

function deduplicateAndOrderObjects(objects: ObjectShape[]): ObjectShape[] {
  const seenNames = new Set<string>();
  const result: ObjectShape[] = [];

  for (const obj of objects) {
    if (!seenNames.has(obj.name)) {
      seenNames.add(obj.name);
      result.push(obj);
    }
  }

  return result;
}

function singularize(name: string): string {
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return name;
}
