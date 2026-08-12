import { test } from "node:test";
import assert from "node:assert/strict";
import { base64UrlDecode, base64UrlEncode, decodeShareFragment, encodeShareFragment } from "./share.ts";

test("base64Url round-trips bytes without URL-unsafe characters", () => {
  const bytes = new Uint8Array([0, 1, 2, 127, 128, 253, 254, 255]);
  const encoded = base64UrlEncode(bytes);
  assert.ok(!encoded.includes("+") && !encoded.includes("/") && !encoded.includes("="));
  assert.deepEqual(Array.from(base64UrlDecode(encoded)), Array.from(bytes));
});

test("share fragment round-trips a JSON document through compression", async () => {
  const original = JSON.stringify({ hello: "world", nested: { list: [1, 2, 3] } });
  const fragment = await encodeShareFragment(original);
  assert.ok(!fragment.includes("+") && !fragment.includes("/"));
  const decoded = await decodeShareFragment(fragment);
  assert.equal(decoded, original);
});
