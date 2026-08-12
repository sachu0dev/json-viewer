# Phase 3 — Conversion Platform

Source: [VISION.md](./VISION.md) §46 Phase 3, §11 (JSON → TypeScript), §12 (Code Generators), §13 (Format Converters)

**Status: 100% shipped.** All Phase 3 converter features shipped, verified, and pre-rendered statically.

## Shipped Features

- [x] **Shape Inference Core** (`lib/converters/shape-inferer.ts`) — Unified intermediate representation (IR) inference engine for primitives, nested objects, union types, and optional fields.
- [x] **Dynamic Route & Static Pre-rendering** (`app/[converterSlug]/page.tsx`) — Next.js `generateStaticParams()` pre-renders all 13 converter routes statically at build time; dynamic `generateMetadata()` serves targeted server-side SEO per page.
- [x] **Unified Converter UI** (`components/ConverterPlayground.tsx`) — Dual-pane live code generation playground with header target switcher dropdown, tailored options toolbar, Copy output, Download file, and sample JSON loader.
- [x] **Code Generators**:
  - [x] **JSON → TypeScript** (`lib/converters/typescript.ts`) — interface vs type, optional, readonly, export keyword.
  - [x] **JSON → Python** (`lib/converters/python.ts`) — Pydantic v2 `BaseModel`, `@dataclass`, `TypedDict`.
  - [x] **JSON → Go** (`lib/converters/go.ts`) — structs with `json:"..."` tags.
  - [x] **JSON → Rust** (`lib/converters/rust.ts`) — structs with Serde `#[derive(Serialize, Deserialize)]`.
  - [x] **JSON → Java** (`lib/converters/java.ts`) — Java 17 `record` vs `class` with `@JsonProperty`.
  - [x] **JSON → C#** (`lib/converters/csharp.ts`) — `record` vs `class` with `[JsonPropertyName]`.
  - [x] **JSON → Swift** (`lib/converters/swift.ts`) — `Codable` structs with `CodingKeys`.
  - [x] **JSON → JavaScript** (`lib/converters/javascript.ts`) — object literal & JSDoc `@typedef`.
- [x] **Format Converters**:
  - [x] **JSON → CSV** (`lib/converters/csv.ts`) — dot notation object flattening (`user.address.city`), delimiter, header row toggle.
  - [x] **JSON ↔ YAML** (`lib/converters/yaml.ts`) — bidirectional clean YAML.
  - [x] **JSON ↔ XML** (`lib/converters/xml.ts`) — bidirectional formatted XML.
  - [x] **JSON → TOML** (`lib/converters/toml.ts`) — TOML table configuration files.
  - [x] **JSON → SQL** (`lib/converters/sql.ts`) — `CREATE TABLE` DDL & `INSERT INTO` DML statements.
- [x] **Cross-Page Handoff & Palette Integration** — Toolbar "Convert to…" dropdown and Command Palette entries for all 13 converter targets.
