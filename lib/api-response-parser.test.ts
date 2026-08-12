import { describe, it } from "node:test";
import assert from "node:assert";
import { parseHttpResponse } from "./api-response-parser.ts";

describe("parseHttpResponse", () => {
  it("parses raw HTTP status line, headers, and JSON body", () => {
    const raw = `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache

{
  "status": "success",
  "users": ["Alice", "Bob"]
}`;

    const res = parseHttpResponse(raw);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.statusText, "OK");
    assert.strictEqual(res.headers.length, 2);
    assert.strictEqual(res.headers[0].name, "Content-Type");
    assert.strictEqual(res.isJson, true);
    assert.strictEqual((res.parsedJson as { status: string }).status, "success");
  });

  it("parses 404 error responses with headers and JSON message", () => {
    const raw = `HTTP/2 404 Not Found
content-type: application/json; charset=utf-8

{
  "error": "User not found",
  "code": 404
}`;

    const res = parseHttpResponse(raw);
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.statusText, "Not Found");
    assert.strictEqual(res.isJson, true);
    assert.strictEqual((res.parsedJson as { code: number }).code, 404);
  });

  it("handles non-JSON raw body response gracefully", () => {
    const raw = `HTTP/1.1 500 Internal Server Error
Content-Type: text/plain

Database connection failed`;

    const res = parseHttpResponse(raw);
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.isJson, false);
    assert.strictEqual(res.body, "Database connection failed");
  });
});
