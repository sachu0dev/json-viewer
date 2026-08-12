import type { Theme } from "./themes";

// { } brace icon with a small color-coded JSON key/string/number dot stack in
// the gap — recolors per theme so the browser tab always matches the app.
function buildFaviconSvg(theme: Theme): string {
  const { panel, jsonPunctuation, jsonKey, jsonString, jsonNumber } = theme.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="7" fill="${panel}"/>
<text x="1" y="25" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="26" font-weight="700" fill="${jsonPunctuation}">{</text>
<text x="14" y="25" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="26" font-weight="700" fill="${jsonPunctuation}">}</text>
<circle cx="16" cy="10" r="2.1" fill="${jsonKey}"/>
<circle cx="16" cy="16" r="2.1" fill="${jsonString}"/>
<circle cx="16" cy="22" r="2.1" fill="${jsonNumber}"/>
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
