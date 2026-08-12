# Devure JSON

A free, local-first JSON workspace: viewer, formatter, differ, JSONPath
playground, JSON Schema validator, JWT decoder, API response inspector, and
JSON-to-code/config converters (TypeScript, Python, Go, Rust, Java, C#,
Swift, JavaScript, CSV, YAML, XML, TOML, SQL) — all in one app.

**Nothing you paste ever leaves your browser.** Parsing runs inside a Web
Worker and the tree view is virtualized, so multi-megabyte files stay
responsive instead of freezing the tab. There's no server, no account, no
upload step. See [`/privacy`](https://json.devure.in/privacy) (or
[`components/PrivacyPage.tsx`](components/PrivacyPage.tsx)) for the exact
architecture.

## Features

- **Viewer** — Tree and Split views, syntax highlighting, inline node
  editing (add/rename/delete), auto-repair for common syntax errors,
  minify/beautify.
- **JSON Diff** — side-by-side comparison of two documents.
- **JSONPath Playground** — query JSON with live results, expression
  history, and a quick reference.
- **Schema Validator** — Draft-07 / 2019-09 / 2020-12 (auto-detected),
  humanized error messages, infer-a-schema-from-JSON, save/load named
  schemas, and a built-in regex tester.
- **JWT Decoder** — decodes header/payload, surfaces every standard claim
  plus independent expiry and not-before status.
- **API Response Inspector** — body-kind detection (JSON/HTML/XML/text),
  cookie/header parsing.
- **JSONL Viewer** — stream/inspect newline-delimited JSON.
- **Large Files** — Web Worker parsing + virtualized rendering for
  multi-MB documents.
- **Converters** — JSON to TypeScript, Python, Go, Rust, Java, C#, Swift,
  JavaScript, CSV, YAML, XML, TOML, SQL, with correct handling of mixed
  array shapes and unions (not just the happy path).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run lint       # ESLint
npm test           # unit tests (lib/*.test.ts)
npm run build      # production build
```

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Ajv (JSON
Schema) · jsonpath-plus · Web Workers for all parsing/diffing work.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — scope, what gets accepted, and
how to open a PR.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — free to use, modify,
and share for any noncommercial purpose (personal projects, learning,
research, nonprofit/education). Commercial use is reserved to the
copyright holder. See [LICENSE](LICENSE) for the full terms, or contact
[devure.in](https://devure.in) about commercial licensing.
