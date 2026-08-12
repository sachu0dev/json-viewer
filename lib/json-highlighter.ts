import type { ThemeColors } from "./themes";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function highlightJsonToTokens(
  code: string,
  colors: ThemeColors,
  searchQuery?: string
): string {
  if (!code) return "";

  const tokenRegex =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*(?=:)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:]+)/g;

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, match.index));
    }

    const [
      full,
      keyToken,
      stringToken,
      boolToken,
      nullToken,
      numToken,
      punctToken,
    ] = match;

    if (keyToken !== undefined) {
      result += `<span style="color: ${colors.jsonKey}; font-weight: 500">${escapeHtml(keyToken)}</span>`;
    } else if (stringToken !== undefined) {
      result += `<span style="color: ${colors.jsonString}">${escapeHtml(stringToken)}</span>`;
    } else if (boolToken !== undefined) {
      result += `<span style="color: ${colors.jsonBoolean}; font-weight: 500">${escapeHtml(boolToken)}</span>`;
    } else if (nullToken !== undefined) {
      result += `<span style="color: ${colors.jsonNull}; font-weight: 500">${escapeHtml(nullToken)}</span>`;
    } else if (numToken !== undefined) {
      result += `<span style="color: ${colors.jsonNumber}">${escapeHtml(numToken)}</span>`;
    } else if (punctToken !== undefined) {
      result += `<span style="color: ${colors.jsonPunctuation}">${escapeHtml(punctToken)}</span>`;
    } else {
      result += escapeHtml(full);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  // Highlight search query substrings if searchQuery is non-empty
  if (searchQuery && searchQuery.trim().length > 0) {
    const escapedQuery = escapeHtml(searchQuery.trim());
    const queryRegex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    result = result.replace(
      queryRegex,
      `<mark style="background-color: ${colors.accent}; color: #000000; font-weight: bold; border-radius: 2px; padding: 0 2px;">$1</mark>`
    );
  }

  return result;
}
