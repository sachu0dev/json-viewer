import { test } from "node:test";
import assert from "node:assert/strict";
import {
  base64UrlDecode,
  base64UrlEncode,
  decodeLegacyGzipFragment,
  decodeShareFragment,
  encodeShareFragment,
  minifyForShare,
} from "./share.ts";

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
  assert.equal(await decodeShareFragment(fragment), original);
});

test("minify strips formatting whitespace but never touches string contents", () => {
  const pretty = '{\n  "a": 1,\n  "msg": "keep  these   spaces\\tand tabs"\n}';
  assert.equal(minifyForShare(pretty), '{"a":1,"msg":"keep  these   spaces\\tand tabs"}');
});

test("minify preserves number spelling, key order, and duplicate keys", () => {
  // A JSON.parse/stringify round-trip would rewrite 1.0 -> 1, 1e3 -> 1000,
  // truncate the big integer, reorder the numeric-like keys, and collapse the
  // duplicate. The whitespace scanner must do none of that.
  const tricky = '{ "2": 0, "1": 0, "big": 12345678901234567890, "f": 1.0, "e": 1e3, "d": 1, "d": 2 }';
  const minified = minifyForShare(tricky);
  assert.equal(minified, '{"2":0,"1":0,"big":12345678901234567890,"f":1.0,"e":1e3,"d":1,"d":2}');
});

test("minify leaves non-strict JSON verbatim so tolerant-parse input survives", () => {
  // Stripping newlines here would swallow the rest of the document into the
  // // comment, and single-quoted strings must keep their inner spacing.
  const jsLiteral = "{ name: 'a  b', // note\n  n: 1 }";
  assert.equal(minifyForShare(jsLiteral), jsLiteral);
});

test("invalid JSON still round-trips through a share link unchanged", async () => {
  const broken = '{ "a": 1, %%%oops%%%, "b": 2 }';
  assert.equal(await decodeShareFragment(await encodeShareFragment(broken)), broken);
});

test("legacy gzip fragments still decode", async () => {
  // Built the way the pre-deflate-raw encoder did: raw gzip, no minification.
  const original = '{\n  "legacy": true\n}';
  const gz = await new Response(
    new Blob([original]).stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  const fragment = base64UrlEncode(new Uint8Array(gz));
  assert.equal(await decodeLegacyGzipFragment(fragment), original);
});

test("deflate-raw + minify produces a shorter fragment than the old gzip encoding", async () => {
  const doc = JSON.stringify({ items: Array.from({ length: 20 }, (_, i) => ({ id: i, name: `item ${i}` })) }, null, 2);
  const gz = await new Response(
    new Blob([doc]).stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  const legacyLength = base64UrlEncode(new Uint8Array(gz)).length;
  assert.ok(
    (await encodeShareFragment(doc)).length < legacyLength,
    "new encoding should not be longer than the one it replaced",
  );
});
