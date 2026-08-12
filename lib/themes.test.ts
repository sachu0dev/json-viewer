import assert from "node:assert";
import { test } from "node:test";
import { THEMES, DEFAULT_THEME_ID, getThemeById } from "./themes.ts";

test("THEMES contains exactly 10 popular developer themes", () => {
  assert.strictEqual(THEMES.length, 10);
});

test("each theme has required color fields and unique id", () => {
  const ids = new Set<string>();
  for (const theme of THEMES) {
    assert.ok(theme.id, "Theme must have an id");
    assert.ok(theme.name, "Theme must have a name");
    assert.ok(!ids.has(theme.id), `Duplicate theme id: ${theme.id}`);
    ids.add(theme.id);

    const { colors } = theme;
    assert.ok(colors.bg, "Theme colors.bg required");
    assert.ok(colors.fg, "Theme colors.fg required");
    assert.ok(colors.jsonKey, "Theme colors.jsonKey required");
    assert.ok(colors.jsonString, "Theme colors.jsonString required");
    assert.ok(colors.jsonNumber, "Theme colors.jsonNumber required");
    assert.ok(colors.jsonBoolean, "Theme colors.jsonBoolean required");
    assert.ok(colors.jsonNull, "Theme colors.jsonNull required");
    assert.ok(colors.diffAdded, "Theme colors.diffAdded required");
  }
});

test("getThemeById returns requested theme or default fallback", () => {
  const catppuccin = getThemeById("catppuccin");
  assert.strictEqual(catppuccin.id, "catppuccin");

  const tokyoNight = getThemeById("tokyo-night");
  assert.strictEqual(tokyoNight.id, "tokyo-night");

  const fallback = getThemeById("unknown-theme-xyz");
  assert.strictEqual(fallback.id, DEFAULT_THEME_ID);
});

test("loadSettings initializes with a valid theme ID", async () => {
  const { loadSettings } = await import("./settings.ts");
  const settings = loadSettings();
  assert.ok(THEMES.some((t) => t.id === settings.themeId), `Theme ID '${settings.themeId}' must be a valid theme ID`);
});
