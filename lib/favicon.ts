import type { Theme } from "./themes";

// { } brace icon with a small color-coded JSON key/string/number dot stack in
// the gap — recolors per theme so the browser tab always matches the app.
// The right brace is a mirror (scale(-1,1)) of the left one, not a separate
// hand-tuned path or font glyph, so the gap is exactly symmetric around
// x=16 by construction and the dots land dead-center every time.
const BRACE_PATH = "M13 5 C9 5 8 6 8 9 L8 13 C8 15 7 16 5 16 C7 16 8 17 8 19 L8 23 C8 26 9 27 13 27";

function buildFaviconSvg(theme: Theme): string {
  const { panel, jsonPunctuation, jsonKey, jsonString, jsonNumber } = theme.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="7" fill="${panel}"/>
<path d="${BRACE_PATH}" fill="none" stroke="${jsonPunctuation}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${BRACE_PATH}" fill="none" stroke="${jsonPunctuation}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(32,0) scale(-1,1)"/>
<circle cx="16" cy="10.5" r="2.1" fill="${jsonKey}"/>
<circle cx="16" cy="16" r="2.1" fill="${jsonString}"/>
<circle cx="16" cy="21.5" r="2.1" fill="${jsonNumber}"/>
</svg>`;
}

export function buildFaviconDataUri(theme: Theme): string {
  return `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg(theme))}`;
}

export function applyFavicon(theme: Theme): void {
  if (typeof document === "undefined") return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-theme-favicon]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.dataset.themeFavicon = "true";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = buildFaviconDataUri(theme);
}
