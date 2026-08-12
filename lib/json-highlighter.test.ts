import assert from "node:assert";
import { test } from "node:test";
import { highlightJsonToTokens } from "./json-highlighter.ts";
import { THEMES } from "./themes.ts";

test("highlightJsonToTokens highlights keys, strings, numbers, booleans, and nulls", () => {
  const code = '{"name": "Alice", "age": 30, "active": true, "extra": null}';
  const html = highlightJsonToTokens(code, THEMES[0].colors);
  assert.ok(html.includes(THEMES[0].colors.jsonKey));
  assert.ok(html.includes(THEMES[0].colors.jsonString));
  assert.ok(html.includes(THEMES[0].colors.jsonNumber));
  assert.ok(html.includes(THEMES[0].colors.jsonBoolean));
  assert.ok(html.includes(THEMES[0].colors.jsonNull));
});

test("highlightJsonToTokens highlights search query substrings with mark tag", () => {
  const code = '{"title": "Princess mascara"}';
  const html = highlightJsonToTokens(code, THEMES[0].colors, "Princess");
  assert.ok(html.includes("<mark"));
  assert.ok(html.includes("Princess"));
});
