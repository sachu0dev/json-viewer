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

    // Each element is walked against its own throwaway `collected` list, not
    // the shared one — otherwise every element registers itself as its own
    // object (Item, Item2, Item3…) before mergeShapes below has a chance to
    // fold them into one shape, and a same-named-but-unmerged entry wins the
    // dedupe in deduplicateAndOrderObjects. Only the merged result is real.
    const elementShapes = value.map((item) => walkValue(item, singularize(suggestedName), []));

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
  if (shapes.length === 1) {
    registerShapeObjects(shapes[0], collected);
    return shapes[0];
  }

  // Group by kind
  const objects = shapes.filter((s): s is ObjectShape => s.kind === "object");
  const nonObjects = shapes.filter((s) => s.kind !== "object");

  // If all elements are objects, merge object fields
  if (objects.length === shapes.length) {
    return mergeObjectShapes(objects, suggestedName, collected);
  }

  // Objects mixed with something else (e.g. an object next to `null`) still
  // need to be merged into one canonical shape before joining the union —
  // otherwise two objects that share a name but not fields (object equality
  // below is by name only) collide in the dedupe pass and one loses fields.
  const mergedObject = objects.length > 0 ? mergeObjectShapes(objects, suggestedName, collected) : null;

  const primitives = nonObjects.filter((s): s is PrimitiveShape => s.kind === "primitive");
  if (mergedObject === null) {
    const uniquePrimTypes = Array.from(new Set(primitives.map((p) => p.type)));
    if (uniquePrimTypes.length === 1 && shapes.length === primitives.length) {
      return primitives[0];
    }
  }

  // Deduplicate the remaining (non-object) union members
  const distinctNonObjects: ShapeNode[] = [];
  for (const s of nonObjects) {
    if (!distinctNonObjects.some((existing) => areShapesEquivalent(existing, s))) {
      distinctNonObjects.push(s);
    }
  }

  // Any object shape surviving into the union (nested inside an array or a
  // union member) must be registered — a generator resolves an object member
  // purely by name, so an unregistered one prints an undefined type.
  for (const d of distinctNonObjects) registerShapeObjects(d, collected);

  const distinct = mergedObject ? [mergedObject, ...distinctNonObjects] : distinctNonObjects;
  if (distinct.length === 1) return distinct[0];
  return { kind: "union", types: distinct };
}

function registerShapeObjects(shape: ShapeNode, collected: ObjectShape[]): void {
  if (shape.kind === "object") {
    if (!collected.some((o) => o.name === shape.name)) collected.push(shape);
  } else if (shape.kind === "array") {
    registerShapeObjects(shape.elementType, collected);
  } else if (shape.kind === "union") {
    for (const t of shape.types) registerShapeObjects(t, collected);
  }
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
  if (a.kind === "array" && b.kind === "array") return areShapesEquivalent(a.elementType, b.elementType);
  if (a.kind === "union" && b.kind === "union") {
    return (
      a.types.length === b.types.length &&
      a.types.every((t, i) => areShapesEquivalent(t, b.types[i]))
    );
  }
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
