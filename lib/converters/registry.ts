/**
 * lib/converters/registry.ts
 *
 * Central registry and dynamic code-split loader for all conversion targets.
 * Supports static page pre-rendering (generateStaticParams), dynamic SEO metadata,
 * and lazy converter execution.
 */

export interface ConverterOptionDef {
  id: string;
  label: string;
  type: "select" | "boolean" | "text";
  default: unknown;
  options?: { value: string; label: string }[];
}

export interface ConverterConfig {
  slug: string;
  targetName: string;
  category: "code" | "data";
  title: string;
  description: string;
  fileExtension: string;
  options: ConverterOptionDef[];
  sampleJson: string;
  convertFn: (jsonText: string, opts: Record<string, unknown>) => Promise<string> | string;
}

const DEFAULT_SAMPLE_JSON = `{
  "id": 101,
  "user": {
    "name": "Alice Developer",
    "email": "alice@devure.com",
    "role": "admin",
    "active": true
  },
  "tags": ["frontend", "react", "typescript"],
  "metrics": {
    "loginCount": 42,
    "score": 98.5
  }
}`;

export const CONVERTERS: Record<string, Omit<ConverterConfig, "convertFn"> & { load: () => Promise<unknown> }> = {
  "json-to-typescript": {
    slug: "json-to-typescript",
    targetName: "TypeScript",
    category: "code",
    title: "JSON to TypeScript Converter — Interfaces & Type Generator",
    description: "Convert JSON to clean, strongly-typed TypeScript interfaces and type definitions instantly. 100% browser-based and local-first.",
    fileExtension: ".ts",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      {
        id: "style",
        label: "Declaration Style",
        type: "select",
        default: "interface",
        options: [
          { value: "interface", label: "interface RootObject" },
          { value: "type", label: "type RootObject =" },
        ],
      },
      { id: "exportKeyword", label: "Export Types", type: "boolean", default: true },
      { id: "readOnly", label: "Readonly Properties", type: "boolean", default: false },
    ],
    load: () => import("./typescript"),
  },
  "json-to-python": {
    slug: "json-to-python",
    targetName: "Python",
    category: "code",
    title: "JSON to Python Converter — Pydantic, Dataclass & TypedDict Generator",
    description: "Convert JSON into Python Pydantic v2 models, dataclasses, or TypedDict definitions.",
    fileExtension: ".py",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      {
        id: "mode",
        label: "Class Model",
        type: "select",
        default: "pydantic",
        options: [
          { value: "pydantic", label: "Pydantic v2 BaseModel" },
          { value: "dataclass", label: "@dataclass" },
          { value: "typeddict", label: "TypedDict" },
        ],
      },
    ],
    load: () => import("./python"),
  },
  "json-to-go": {
    slug: "json-to-go",
    targetName: "Go",
    category: "code",
    title: "JSON to Go Converter — Structs & JSON Tags Generator",
    description: "Convert JSON data to Go struct definitions with json tags.",
    fileExtension: ".go",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      { id: "jsonTags", label: "Include json:\"...\" Tags", type: "boolean", default: true },
    ],
    load: () => import("./go"),
  },
  "json-to-rust": {
    slug: "json-to-rust",
    targetName: "Rust",
    category: "code",
    title: "JSON to Rust Converter — Structs & Serde Derives",
    description: "Convert JSON to Rust structs with Serde Serialize and Deserialize annotations.",
    fileExtension: ".rs",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      { id: "serdeDerive", label: "Derive Serde Traits", type: "boolean", default: true },
    ],
    load: () => import("./rust"),
  },
  "json-to-java": {
    slug: "json-to-java",
    targetName: "Java",
    category: "code",
    title: "JSON to Java Converter — Records & Classes",
    description: "Convert JSON to Java records or POJO classes with Jackson annotations.",
    fileExtension: ".java",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      {
        id: "mode",
        label: "Structure",
        type: "select",
        default: "record",
        options: [
          { value: "record", label: "Java 17 Record" },
          { value: "class", label: "Standard Class" },
        ],
      },
    ],
    load: () => import("./java"),
  },
  "json-to-csharp": {
    slug: "json-to-csharp",
    targetName: "C#",
    category: "code",
    title: "JSON to C# Converter — Records & System.Text.Json",
    description: "Convert JSON into C# records or classes with JsonPropertyName attributes.",
    fileExtension: ".cs",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      {
        id: "mode",
        label: "Type",
        type: "select",
        default: "record",
        options: [
          { value: "record", label: "Record" },
          { value: "class", label: "Class" },
        ],
      },
    ],
    load: () => import("./csharp"),
  },
  "json-to-swift": {
    slug: "json-to-swift",
    targetName: "Swift",
    category: "code",
    title: "JSON to Swift Converter — Codable Structs Generator",
    description: "Convert JSON to Swift Codable structs with custom CodingKeys.",
    fileExtension: ".swift",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [],
    load: () => import("./swift"),
  },
  "json-to-javascript": {
    slug: "json-to-javascript",
    targetName: "JavaScript",
    category: "code",
    title: "JSON to JavaScript Converter — Objects & JSDoc Types",
    description: "Convert JSON into JavaScript objects or JSDoc typedef documentation.",
    fileExtension: ".js",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      {
        id: "mode",
        label: "Format",
        type: "select",
        default: "jsdoc",
        options: [
          { value: "jsdoc", label: "JSDoc @typedef" },
          { value: "object", label: "Object Literal" },
        ],
      },
    ],
    load: () => import("./javascript"),
  },
  "json-to-csv": {
    slug: "json-to-csv",
    targetName: "CSV",
    category: "data",
    title: "JSON to CSV Converter — Flatten & Export Tabular Data",
    description: "Convert JSON arrays or objects to CSV tabular format with dot notation object flattening.",
    fileExtension: ".csv",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      { id: "flatten", label: "Flatten Nested Objects (user.address.city)", type: "boolean", default: true },
      { id: "includeHeaders", label: "Include Header Row", type: "boolean", default: true },
    ],
    load: () => import("./csv"),
  },
  "json-to-yaml": {
    slug: "json-to-yaml",
    targetName: "YAML",
    category: "data",
    title: "JSON to YAML Converter — Round-trip Data Format",
    description: "Convert JSON documents to clean YAML syntax instantly.",
    fileExtension: ".yaml",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [],
    load: () => import("./yaml"),
  },
  "json-to-xml": {
    slug: "json-to-xml",
    targetName: "XML",
    category: "data",
    title: "JSON to XML Converter — Standard Element & Attribute Formatting",
    description: "Convert JSON documents to formatted XML documents.",
    fileExtension: ".xml",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [],
    load: () => import("./xml"),
  },
  "json-to-toml": {
    slug: "json-to-toml",
    targetName: "TOML",
    category: "data",
    title: "JSON to TOML Converter — Configuration Format Generator",
    description: "Convert JSON data structures to TOML table configuration files.",
    fileExtension: ".toml",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [],
    load: () => import("./toml"),
  },
  "json-to-sql": {
    slug: "json-to-sql",
    targetName: "SQL",
    category: "data",
    title: "JSON to SQL Converter — CREATE TABLE & INSERT Statements",
    description: "Convert JSON datasets into SQL DDL schema statements and INSERT queries.",
    fileExtension: ".sql",
    sampleJson: DEFAULT_SAMPLE_JSON,
    options: [
      { id: "tableName", label: "Table Name", type: "text", default: "my_table" },
      {
        id: "dialect",
        label: "SQL Dialect",
        type: "select",
        default: "postgresql",
        options: [
          { value: "postgresql", label: "PostgreSQL" },
          { value: "mysql", label: "MySQL" },
          { value: "sqlite", label: "SQLite" },
        ],
      },
    ],
    load: () => import("./sql"),
  },
};

export const CONVERTER_SLUGS = Object.keys(CONVERTERS);

/**
 * Dynamic code-split execution helper
 */
export async function executeConverter(slug: string, jsonText: string, opts: Record<string, unknown>): Promise<string> {
  const config = CONVERTERS[slug];
  if (!config) return `// Error: Unknown converter "${slug}"`;

  const mod = (await config.load()) as Record<string, (json: string, opts?: Record<string, unknown>) => string>;

  if (slug === "json-to-typescript") return mod.convertJsonToTypeScript(jsonText, opts);
  if (slug === "json-to-python") return mod.convertJsonToPython(jsonText, opts);
  if (slug === "json-to-go") return mod.convertJsonToGo(jsonText, opts);
  if (slug === "json-to-rust") return mod.convertJsonToRust(jsonText, opts);
  if (slug === "json-to-java") return mod.convertJsonToJava(jsonText, opts);
  if (slug === "json-to-csharp") return mod.convertJsonToCSharp(jsonText, opts);
  if (slug === "json-to-swift") return mod.convertJsonToSwift(jsonText, opts);
  if (slug === "json-to-javascript") return mod.convertJsonToJavaScript(jsonText, opts);
  if (slug === "json-to-csv") return mod.convertJsonToCsv(jsonText, opts);
  if (slug === "json-to-yaml") return mod.convertJsonToYaml(jsonText);
  if (slug === "json-to-xml") return mod.convertJsonToXml(jsonText);
  if (slug === "json-to-toml") return mod.convertJsonToToml(jsonText);
  if (slug === "json-to-sql") return mod.convertJsonToSql(jsonText, opts);

  return `// Error: Handler missing for "${slug}"`;
}
