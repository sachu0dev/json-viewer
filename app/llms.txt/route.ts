import { SITE_URL } from "@/lib/site";

const BODY = `# Devure JSON

> A free, local-first JSON toolkit. Everything runs client-side in the browser — nothing pasted or uploaded ever reaches a server.

## Tools

- [JSON Viewer](${SITE_URL}/): format, validate, and explore JSON with Tree and Split views.
- [JSON Diff](${SITE_URL}/json-diff): structural diff between two JSON documents.
- [JSONPath Tester](${SITE_URL}/jsonpath): run JSONPath expressions against JSON and see matching paths/values.
- [JSON Schema Validator](${SITE_URL}/json-schema-validator): validate JSON against Draft-07 / 2019-09 / 2020-12 schemas.
- [JWT Decoder](${SITE_URL}/jwt-decoder): decode JWT header/payload and check expiry.
- [API Response Inspector](${SITE_URL}/api-response): parse raw HTTP responses (status, headers, body).
- [JSONL / NDJSON Viewer](${SITE_URL}/jsonl-viewer): validate and filter newline-delimited JSON.
- [Large Files](${SITE_URL}/large-files): open multi-megabyte JSON files without freezing the tab.
- JSON to code/config converters: TypeScript, Python, Go, Rust, Java, C#, Swift, JavaScript, CSV, YAML, XML, TOML, SQL — each at \`${SITE_URL}/json-to-<target>\`.

## Privacy

See ${SITE_URL}/privacy for the exact client-side architecture (no server processing, no uploads).
`;

export async function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
