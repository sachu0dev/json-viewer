"use client";

import { useMemo, useState } from "react";
import { parseJwt, type DecodedJwt } from "@/lib/jwt";
import { encodeShareFragment } from "@/lib/share";
import { useTheme } from "@/hooks/useTheme";
import { ToolShell } from "./ToolShell";

// Sample JWT tokens for instant quick testing
function makeSampleJwt(expOffsetSeconds: number, sub: string, role: string, nbfOffsetSeconds?: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: Record<string, unknown> = {
    sub,
    name: "Alex Dev",
    email: "alex.dev@example.com",
    role,
    iss: "https://auth.devure.in",
    aud: "https://api.devure.in",
    iat: Math.floor(Date.now() / 1000) - 300,
    exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
  };
  if (nbfOffsetSeconds !== undefined) payload.nbf = Math.floor(Date.now() / 1000) + nbfOffsetSeconds;
  const b64h = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const b64p = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64h}.${b64p}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
}

const SAMPLE_TOKENS = [
  { name: "Valid User Token (Expires in 2h)", token: makeSampleJwt(7200, "user_1092", "developer") },
  { name: "Expired Auth Token (Expired 1h ago)", token: makeSampleJwt(-3600, "user_0041", "admin") },
  { name: "Not-Yet-Valid Token (nbf in 10m)", token: makeSampleJwt(7200, "user_5521", "viewer", 600) },
];

const CLAIM_LABELS: Record<string, string> = {
  sub: "Subject",
  iss: "Issuer",
  aud: "Audience",
  iat: "Issued At",
  nbf: "Not Before",
  exp: "Expiration",
};

const TIME_CLAIMS = new Set(["iat", "nbf", "exp"]);

function formatClaimValue(key: string, value: unknown): string {
  if (TIME_CLAIMS.has(key) && typeof value === "number") {
    return `${new Date(value * 1000).toLocaleString()} (unix ${value})`;
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function JwtDecoderPlayground() {
  const [tokenInput, setTokenInput] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRawPayload, setShowRawPayload] = useState(false);

  const { theme } = useTheme();

  const decoded: DecodedJwt = useMemo(() => parseJwt(tokenInput), [tokenInput]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleOpenPayloadInViewer = () => {
    if (!decoded.payload) return;
    encodeShareFragment(JSON.stringify(decoded.payload, null, 2)).then((fragment) => {
      window.open(`/#z=${fragment}`, "_blank", "noopener");
    });
  };

  const otherClaims = decoded.payload
    ? Object.entries(decoded.payload).filter(([k]) => !CLAIM_LABELS[k])
    : [];

  const isEmpty = !tokenInput.trim();

  return (
    <ToolShell
      title="JWT Decoder"
      activeHref="/jwt-decoder"
      commands={SAMPLE_TOKENS.map((s, i) => ({ id: `sample-${i}`, label: `Load sample: ${s.name}` }))}
      onSelectCommand={(id) => {
        if (id.startsWith("sample-")) {
          const idx = Number(id.slice(7));
          if (SAMPLE_TOKENS[idx]) setTokenInput(SAMPLE_TOKENS[idx].token);
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full min-h-0 overflow-hidden">
        {/* Left Column: Token Input Area - 5 Columns */}
        <div
          className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r min-h-0"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg }}
        >
          <div
            className="flex items-center justify-between px-3 py-1.5 text-xs font-medium border-b"
            style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.muted }}
          >
            <label htmlFor="jwt-token-input" className="cursor-default">
              Encoded JWT Token String
            </label>
            <span className="text-[10px] font-mono opacity-60">{tokenInput.length.toLocaleString()} chars</span>
          </div>

          <textarea
            id="jwt-token-input"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste raw JWT (eyJhbGciOi...) here…"
            aria-label="Encoded JWT token string"
            className="flex-1 w-full font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
            style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-1.5 border-t px-3 py-2" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}>
            {SAMPLE_TOKENS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setTokenInput(s.token)}
                className="rounded-full border px-2.5 py-1 text-[11px] font-mono transition-all hover:scale-105"
                style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg, color: theme.colors.fg }}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Privacy Guarantee Note */}
          <div
            className="p-3 border-t text-[11px] flex items-center gap-2"
            style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.muted }}
          >
            <span>🔒</span>
            <span>100% Client-Side. Your token is decoded strictly in browser memory and is never sent over any network.</span>
          </div>
        </div>

        {/* Right Column: Inspection Output - 7 Columns */}
        <div
          className="lg:col-span-7 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4"
          style={{ backgroundColor: theme.colors.panel }}
          aria-live="polite"
        >
          {isEmpty && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2" style={{ color: theme.colors.muted }}>
              <div className="text-2xl">🔑</div>
              <p className="text-xs max-w-xs">Paste a JWT on the left, or load a sample, to see its header, claims, and expiry status.</p>
            </div>
          )}

          {!isEmpty && !decoded.valid && (
            <div
              className="p-4 rounded-lg border text-xs"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
            >
              <div className="font-semibold mb-1">✕ Unable to decode JWT</div>
              <div>{decoded.error}</div>
            </div>
          )}

          {decoded.valid && (
            <>
              {/* Status pills */}
              <div className="flex flex-wrap gap-2">
                <div
                  className="flex flex-wrap items-center gap-2 p-3 rounded-lg border flex-1 min-w-[220px]"
                  style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}
                >
                  <span className="text-xs font-medium opacity-80" style={{ color: theme.colors.fg }}>
                    Expiration:
                  </span>
                  {decoded.expiryStatus?.state === "valid" && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                      style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}
                    >
                      ✓ {decoded.expiryStatus.label}
                    </span>
                  )}
                  {decoded.expiryStatus?.state === "expired" && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                      style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
                    >
                      ✕ {decoded.expiryStatus.label}
                    </span>
                  )}
                  {decoded.expiryStatus?.state === "none" && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                      style={{ backgroundColor: theme.colors.hover, borderColor: theme.colors.border, color: theme.colors.muted }}
                    >
                      {decoded.expiryStatus.label}
                    </span>
                  )}
                </div>

                {decoded.nbfStatus?.state !== "none" && (
                  <div
                    className="flex flex-wrap items-center gap-2 p-3 rounded-lg border flex-1 min-w-[220px]"
                    style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}
                  >
                    <span className="text-xs font-medium opacity-80" style={{ color: theme.colors.fg }}>
                      Not Before:
                    </span>
                    {decoded.nbfStatus?.state === "not-yet-valid" && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                        style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)", color: "#f59e0b" }}
                      >
                        ⏳ {decoded.nbfStatus.label}
                      </span>
                    )}
                    {decoded.nbfStatus?.state === "active" && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                        style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}
                      >
                        ✓ {decoded.nbfStatus.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Header */}
              <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}>
                <div
                  className="flex items-center justify-between px-3 py-2 border-b text-xs font-semibold"
                  style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: "#f43f5e" }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true"></span>
                    HEADER — algorithm ({String(decoded.header?.alg ?? "?")}) & type
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), "header")}
                    className="text-[10px] hover:underline transition-colors"
                    style={{ color: theme.colors.muted }}
                  >
                    {copiedField === "header" ? "Copied!" : "Copy Header"}
                  </button>
                </div>
                <pre className="p-3 font-mono text-xs overflow-x-auto" style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}>
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              {/* Claims table */}
              <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}>
                <div
                  className="flex items-center justify-between px-3 py-2 border-b text-xs font-semibold"
                  style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: "#a855f7" }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" aria-hidden="true"></span>
                    PAYLOAD — claims
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleOpenPayloadInViewer}
                      className="text-[10px] hover:underline transition-colors"
                      style={{ color: theme.colors.accent }}
                      title="Open the decoded payload in the main JSON viewer"
                    >
                      Open in viewer →
                    </button>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), "payload")}
                      className="text-[10px] hover:underline transition-colors"
                      style={{ color: theme.colors.muted }}
                    >
                      {copiedField === "payload" ? "Copied!" : "Copy Payload"}
                    </button>
                  </div>
                </div>

                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(CLAIM_LABELS)
                      .filter(([key]) => decoded.payload && decoded.payload[key] !== undefined)
                      .map(([key, label]) => (
                        <tr key={key} className="border-b last:border-b-0" style={{ borderColor: theme.colors.border }}>
                          <td className="px-3 py-1.5 font-mono font-semibold whitespace-nowrap align-top" style={{ color: theme.colors.accent }}>
                            {key}
                            <div className="font-sans font-normal opacity-60" style={{ color: theme.colors.muted }}>
                              {label}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 font-mono break-all" style={{ color: theme.colors.fg }}>
                            {formatClaimValue(key, decoded.payload![key])}
                          </td>
                        </tr>
                      ))}
                    {otherClaims.length === 0 && Object.keys(CLAIM_LABELS).every((k) => decoded.payload?.[k] === undefined) && (
                      <tr>
                        <td colSpan={2} className="px-3 py-3 text-center opacity-60" style={{ color: theme.colors.muted }}>
                          No standard claims present in this payload.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {otherClaims.length > 0 && (
                  <div className="border-t px-3 py-2" style={{ borderColor: theme.colors.border }}>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-70" style={{ color: theme.colors.muted }}>
                      Other claims
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {otherClaims.map(([key, value]) => (
                          <tr key={key} className="border-b last:border-b-0" style={{ borderColor: theme.colors.border }}>
                            <td className="px-0 py-1 pr-3 font-mono font-semibold whitespace-nowrap align-top" style={{ color: theme.colors.fg }}>
                              {key}
                            </td>
                            <td className="px-0 py-1 font-mono break-all" style={{ color: theme.colors.muted }}>
                              {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={() => setShowRawPayload((v) => !v)}
                  className="w-full border-t px-3 py-1.5 text-left text-[10px] font-mono opacity-70 hover:opacity-100"
                  style={{ borderColor: theme.colors.border, color: theme.colors.muted }}
                  aria-expanded={showRawPayload}
                >
                  {showRawPayload ? "▾ Hide raw payload JSON" : "▸ Show raw payload JSON"}
                </button>
                {showRawPayload && (
                  <pre className="p-3 font-mono text-xs overflow-x-auto border-t" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg, color: theme.colors.fg }}>
                    {JSON.stringify(decoded.payload, null, 2)}
                  </pre>
                )}
              </div>

              {/* Signature & Required Verbatim Disclaimer */}
              <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}>
                <div
                  className="flex items-center justify-between px-3 py-2 border-b text-xs font-semibold"
                  style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.accent }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accent }} aria-hidden="true"></span>
                    SIGNATURE
                  </span>
                </div>
                <div className="p-3 font-mono text-xs break-all" style={{ backgroundColor: theme.colors.bg, color: theme.colors.accent }}>
                  {decoded.signature || "unsigned"}
                </div>

                {/* Mandatory Disclaimer (§14 requirement) */}
                <div
                  className="p-3 border-t text-xs font-medium flex items-center gap-2"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.25)", color: "#f59e0b" }}
                >
                  <span>⚠️</span>
                  <span>Decoding a JWT does not verify its signature.</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
