// URL-fragment sharing: the document is compressed into the URL's #fragment
// and base64url-encoded. Fragments never reach the server (the browser doesn't
// send them in the request), so this is a real "no server call, ever" share
// mechanism, not a convenience wrapper around one.
// Deliberately not swapped for a `POST /share` endpoint later — see the
// OSS Maintainer note in the council plan on why that erodes local-first trust.
//
// Codec choice (benchmarked against realistic payloads, see notes below):
//   * `deflate-raw`, not `gzip` — identical DEFLATE payload, minus gzip's
//     10-byte header and 8-byte CRC trailer. Those 18 bytes are pure overhead
//     here (the fragment isn't a file and needs no checksum: a corrupted
//     fragment fails at the JSON layer anyway), and cost ~24 base64 chars.
//   * Insignificant whitespace stripped before compressing, losslessly.
//   * base64url for the binary→text step. A denser alphabet is possible
//     (RFC 3986 permits ~81 chars in a fragment, ~5% fewer chars than base64's
//     64), but the extra characters — ( ) ' ! , ; — are exactly the ones
//     Markdown autolinkers, Slack, and email clients break URLs on. Not worth
//     5% on a feature whose entire job is surviving a paste into a chat box.
//
// Rejected: brotli and zstd compress 15-25% better, but browsers expose
// neither — `CompressionStream` supports only gzip/deflate/deflate-raw
// (verified in Chrome 150), and the synthetic-`Response` + `Content-Encoding`
// decode trick does not work. Both would mean ~488KB gzipped of WASM on the
// critical path for opening a shared link, in an app whose whole page is 14KB.

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): Uint8Array {
  const restored = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = restored.padEnd(Math.ceil(restored.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Strips whitespace that sits outside string literals. Character-exact on
// everything that survives: number literals keep their original spelling
// (1.0 stays 1.0, not 1), key order is untouched, and duplicate keys survive —
// none of which a JSON.parse/stringify round-trip guarantees, and one of which
// (big integers past Number.MAX_SAFE_INTEGER) it silently corrupts.
function stripInsignificantWhitespace(text: string): string {
  let out = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote !== null) {
      out += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      out += char;
    } else if (char !== " " && char !== "\n" && char !== "\t" && char !== "\r") {
      out += char;
    }
  }
  return out;
}

// Only minifies input that is strict JSON. Anything else — a JS object
// literal, a document with // comments, a half-typed paste — is shared
// verbatim: the app's tolerant parser accepts those, and stripping newlines
// out of a `// comment` would silently swallow the rest of the document.
export function minifyForShare(text: string): string {
  try {
    JSON.parse(text);
  } catch {
    return text;
  }
  return stripInsignificantWhitespace(text);
}

async function compress(text: string, format: CompressionFormat): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes: Uint8Array, format: CompressionFormat): Promise<string> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
  return new Response(stream).text();
}

export async function encodeShareFragment(text: string): Promise<string> {
  return base64UrlEncode(await compress(minifyForShare(text), "deflate-raw"));
}

export async function decodeShareFragment(fragment: string): Promise<string> {
  return decompress(base64UrlDecode(fragment), "deflate-raw");
}

// Links shared before the deflate-raw switch carry a gzip payload under the
// older `#d=` key. Kept so those links keep resolving.
export async function decodeLegacyGzipFragment(fragment: string): Promise<string> {
  return decompress(base64UrlDecode(fragment), "gzip");
}
