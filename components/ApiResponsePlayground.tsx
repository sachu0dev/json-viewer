"use client";

import { useMemo, useState } from "react";
import { parseHttpResponse, type ParsedHttpResponse } from "@/lib/api-response-parser";
import { encodeShareFragment } from "@/lib/share";
import { useTheme } from "@/hooks/useTheme";
import { ToolShell } from "./ToolShell";

const SAMPLE_RESPONSES = [
  {
    name: "200 OK (JSON API Response)",
    raw: `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=3600
X-Powered-By: Next.js
Set-Cookie: session=abc123; Path=/; HttpOnly; SameSite=Lax

{
  "status": "success",
  "data": {
    "user": {
      "id": "usr_99182",
      "name": "Sushil Kumar",
      "roles": ["developer", "maintainer"]
    },
    "tokenType": "Bearer",
    "expiresIn": 86400
  }
}`,
  },
  {
    name: "404 Not Found (API Error)",
    raw: `HTTP/2 404 Not Found
Content-Type: application/json
Date: Wed, 12 Aug 2026 14:30:00 GMT

{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested API endpoint '/v1/users/9999' was not found on this server."
  }
}`,
  },
  {
    name: "500 (HTML error page)",
    raw: `HTTP/1.1 500 Internal Server Error
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
  <head><title>Server Error</title></head>
  <body><h1>500 — Internal Server Error</h1></body>
</html>`,
  },
];

const BODY_KIND_LABEL: Record<ParsedHttpResponse["bodyKind"], string> = {
  json: "JSON detected",
  html: "HTML document",
  xml: "XML document",
  text: "Plain text",
  empty: "Empty body",
};

export function ApiResponsePlayground() {
  const [rawInput, setRawInput] = useState("");
  const [copied, setCopied] = useState(false);

  const { theme } = useTheme();

  const parsed: ParsedHttpResponse = useMemo(() => parseHttpResponse(rawInput), [rawInput]);

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", fg: "#10b981" };
    if (code >= 300 && code < 400) return { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)", fg: "#f59e0b" };
    if (code >= 400) return { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", fg: "#ef4444" };
    return { bg: theme.colors.hover, border: theme.colors.border, fg: theme.colors.muted };
  };

  const handleOpenInTree = () => {
    if (parsed.isJson && parsed.body) {
      encodeShareFragment(parsed.body).then((fragment) => {
        window.open(`/#z=${fragment}`, "_blank", "noopener");
      });
    }
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(parsed.isJson ? JSON.stringify(parsed.parsedJson, null, 2) : parsed.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const statusStyle = getStatusColor(parsed.statusCode);
  const isEmpty = !rawInput.trim();

  return (
    <ToolShell
      title="API Response Inspector"
      activeHref="/api-response"
      commands={SAMPLE_RESPONSES.map((s, i) => ({ id: `sample-${i}`, label: `Load sample: ${s.name}` }))}
      onSelectCommand={(id) => {
        if (id.startsWith("sample-")) {
          const idx = Number(id.slice(7));
          if (SAMPLE_RESPONSES[idx]) setRawInput(SAMPLE_RESPONSES[idx].raw);
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full min-h-0 overflow-hidden">
        {/* Left Column: Raw Response Input - 5 Columns */}
        <div
          className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r min-h-0"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg }}
        >
          <div
            className="flex items-center justify-between px-3 py-1.5 text-xs font-medium border-b"
            style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.muted }}
          >
            <label htmlFor="api-raw-input" className="cursor-default">
              Raw HTTP Response Dump
            </label>
            <span className="text-[10px] font-mono opacity-60">{rawInput.length.toLocaleString()} chars</span>
          </div>

          <textarea
            id="api-raw-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={"Paste raw HTTP headers + body, or curl -i output…\n\nHTTP/1.1 200 OK\nContent-Type: application/json\n\n{ \"ok\": true }"}
            aria-label="Raw HTTP response dump"
            className="flex-1 w-full font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
            style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-1.5 border-t px-3 py-2" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}>
            {SAMPLE_RESPONSES.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setRawInput(s.raw)}
                className="rounded-full border px-2.5 py-1 text-[11px] font-mono transition-all hover:scale-105"
                style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg, color: theme.colors.fg }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Inspector Output - 7 Columns */}
        <div
          className="lg:col-span-7 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4"
          style={{ backgroundColor: theme.colors.panel }}
          aria-live="polite"
        >
          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2" style={{ color: theme.colors.muted }}>
              <div className="text-2xl">📡</div>
              <p className="text-xs max-w-xs">
                Paste a raw HTTP response (status line + headers + body), or a `curl -i` dump, to inspect it.
              </p>
            </div>
          ) : parsed.error ? (
            <div
              className="p-4 rounded-lg border text-xs"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
            >
              {parsed.error}
            </div>
          ) : (
            <>
              {/* Status Line Bar */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border"
                style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium opacity-80" style={{ color: theme.colors.fg }}>
                    Status Code:
                  </span>
                  <span
                    className="px-3 py-1 rounded-full border text-xs font-bold font-mono"
                    style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border, color: statusStyle.fg }}
                  >
                    {parsed.statusCode} {parsed.statusText}
                  </span>
                </div>

                {parsed.isJson && (
                  <button
                    onClick={handleOpenInTree}
                    className="text-xs font-semibold px-3 py-1.5 rounded transition-opacity hover:opacity-90 flex items-center gap-1.5"
                    style={{ backgroundColor: theme.colors.accent, color: "#ffffff" }}
                  >
                    <span>🌳</span> Open in Interactive Tree
                  </button>
                )}
              </div>

              {/* HTTP Headers Table */}
              <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}>
                <div
                  className="px-3 py-2 border-b text-xs font-semibold flex items-center justify-between"
                  style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.fg }}
                >
                  <span>HTTP HEADERS ({parsed.headers.length})</span>
                </div>

                {parsed.headers.length === 0 ? (
                  <div className="p-3 text-xs opacity-50 font-mono italic" style={{ color: theme.colors.muted }}>
                    No HTTP headers detected in dump.
                  </div>
                ) : (
                  <div className="divide-y font-mono text-xs max-h-48 overflow-y-auto" style={{ borderColor: theme.colors.border }}>
                    {parsed.headers.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-1.5 transition-colors gap-4"
                        style={{ backgroundColor: idx % 2 === 0 ? theme.colors.bg : theme.colors.panel }}
                      >
                        <span className="font-medium shrink-0" style={{ color: theme.colors.accent }}>
                          {h.name}:
                        </span>
                        <span className="truncate text-right" style={{ color: theme.colors.fg }}>
                          {h.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cookies */}
              {parsed.cookies.length > 0 && (
                <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}>
                  <div
                    className="px-3 py-2 border-b text-xs font-semibold"
                    style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.fg }}
                  >
                    COOKIES ({parsed.cookies.length})
                  </div>
                  <div className="divide-y font-mono text-xs" style={{ borderColor: theme.colors.border }}>
                    {parsed.cookies.map((c, idx) => (
                      <div key={idx} className="px-3 py-1.5">
                        <div>
                          <span className="font-semibold" style={{ color: theme.colors.accent }}>
                            {c.name}
                          </span>
                          <span style={{ color: theme.colors.fg }}> = {c.value}</span>
                        </div>
                        {c.attributes.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {c.attributes.map((attr, i) => (
                              <span
                                key={i}
                                className="rounded px-1.5 py-0.5 text-[10px]"
                                style={{ backgroundColor: theme.colors.hover, color: theme.colors.muted }}
                              >
                                {attr}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Body */}
              <div className="rounded-lg border overflow-hidden flex-1 flex flex-col min-h-0" style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}>
                <div
                  className="px-3 py-2 border-b text-xs font-semibold flex items-center justify-between shrink-0"
                  style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.fg }}
                >
                  <span>RESPONSE BODY</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded border"
                      style={
                        parsed.bodyKind === "json"
                          ? { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }
                          : { backgroundColor: theme.colors.hover, borderColor: theme.colors.border, color: theme.colors.muted }
                      }
                    >
                      {BODY_KIND_LABEL[parsed.bodyKind]}
                    </span>
                    {parsed.body && (
                      <button onClick={handleCopyBody} className="text-[10px] hover:underline" style={{ color: theme.colors.muted }}>
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 font-mono text-xs flex-1 overflow-auto" style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}>
                  {parsed.isJson ? (
                    <pre>{JSON.stringify(parsed.parsedJson, null, 2)}</pre>
                  ) : (
                    <pre className="whitespace-pre-wrap wrap-break-word">{parsed.body || "(Empty Body)"}</pre>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
