export type BodyKind = "json" | "html" | "xml" | "text" | "empty";

export interface ParsedCookie {
  name: string;
  value: string;
  attributes: string[];
}

export interface ParsedHttpResponse {
  statusCode: number;
  statusText: string;
  headers: Array<{ name: string; value: string }>;
  contentType?: string;
  body: string;
  isJson: boolean;
  parsedJson?: unknown;
  bodyKind: BodyKind;
  cookies: ParsedCookie[];
  error?: string;
}

function detectBodyKind(body: string, contentType: string | undefined, isJson: boolean): BodyKind {
  if (!body) return "empty";
  if (isJson) return "json";
  const ct = (contentType ?? "").toLowerCase();
  const trimmed = body.trim();
  if (ct.includes("html") || /^<!doctype html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) return "html";
  if (ct.includes("xml") || /^<\?xml/i.test(trimmed)) return "xml";
  return "text";
}

function parseCookies(headers: Array<{ name: string; value: string }>): ParsedCookie[] {
  return headers
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => {
      const [pair, ...attrs] = h.value.split(";").map((s) => s.trim());
      const eqIdx = pair.indexOf("=");
      const name = eqIdx === -1 ? pair : pair.slice(0, eqIdx);
      const value = eqIdx === -1 ? "" : pair.slice(eqIdx + 1);
      return { name, value, attributes: attrs };
    });
}

/**
 * Parses raw HTTP response text into status line, headers map, and body (§32).
 */
export function parseHttpResponse(rawInput: string): ParsedHttpResponse {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      statusCode: 0,
      statusText: "No Input",
      headers: [],
      body: "",
      isJson: false,
      bodyKind: "empty",
      cookies: [],
      error: "Please paste an HTTP response dump (headers & body).",
    };
  }

  const lines = trimmed.split(/\r?\n/);
  let statusCode = 200;
  let statusText = "OK";
  let headerEndIndex = -1;
  const headers: Array<{ name: string; value: string }> = [];

  // Check first line for HTTP Status Line (e.g. HTTP/1.1 200 OK or 200 OK)
  const firstLine = lines[0].trim();
  const statusMatch = firstLine.match(/^(?:HTTP\/\d(?:\.\d)?\s+)?(\d{3})(?:\s+(.*))?$/i);

  let startHeaderLine = 0;
  if (statusMatch) {
    statusCode = parseInt(statusMatch[1], 10);
    statusText = statusMatch[2] ? statusMatch[2].trim() : "OK";
    startHeaderLine = 1;
  }

  // Parse Headers until an empty line is encountered
  for (let i = startHeaderLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") {
      headerEndIndex = i;
      break;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const name = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      headers.push({ name, value });
    } else if (i === 0 && !statusMatch) {
      // Not a header line, likely direct JSON body input
      break;
    }
  }

  // Extract body
  let body = "";
  if (headerEndIndex !== -1) {
    body = lines.slice(headerEndIndex + 1).join("\n").trim();
  } else if (headers.length > 0) {
    // If no blank line separating, body starts after last header line
    body = lines.slice(headers.length + startHeaderLine).join("\n").trim();
  } else {
    body = trimmed;
  }

  // Content-Type detection
  const contentTypeHeader = headers.find((h) => h.name.toLowerCase() === "content-type");
  const contentType = contentTypeHeader?.value;

  // JSON detection
  let isJson = false;
  let parsedJson: unknown = undefined;

  if (body) {
    try {
      parsedJson = JSON.parse(body);
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  return {
    statusCode,
    statusText,
    headers,
    contentType,
    body,
    isJson,
    parsedJson,
    bodyKind: detectBodyKind(body, contentType, isJson),
    cookies: parseCookies(headers),
  };
}
