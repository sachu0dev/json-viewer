// URL-fragment sharing: the document is encoded into the URL's #fragment,
// gzip-compressed and base64url-encoded. Fragments never reach the server
// (the browser doesn't send them in the request), so this is a real "no
// server call, ever" share mechanism, not a convenience wrapper around one.
// Deliberately not swapped for a `POST /share` endpoint later — see the
// OSS Maintainer note in the council plan on why that erodes local-first trust.

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

export async function encodeShareFragment(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return base64UrlEncode(new Uint8Array(buffer));
}

export async function decodeShareFragment(fragment: string): Promise<string> {
  const bytes = base64UrlDecode(fragment);
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(buffer);
}
