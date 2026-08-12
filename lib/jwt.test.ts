import { describe, it } from "node:test";
import assert from "node:assert";
import { parseJwt } from "./jwt.ts";

describe("parseJwt", () => {
  // Helper to create synthetic JWT token
  function makeJwt(header: object, payload: object, sig = "synthetic_signature"): string {
    const b64h = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64p = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${b64h}.${b64p}.${sig}`;
  }

  it("decodes a valid JWT token header, payload, and signature", () => {
    const token = makeJwt(
      { alg: "HS256", typ: "JWT" },
      { sub: "user_123", name: "Sushil Dev", exp: Math.floor(Date.now() / 1000) + 3600 }
    );

    const res = parseJwt(token);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.header?.alg, "HS256");
    assert.strictEqual(res.payload?.sub, "user_123");
    assert.strictEqual(res.signature, "synthetic_signature");
    assert.strictEqual(res.expiryStatus?.state, "valid");
  });

  it("correctly identifies an expired JWT token", () => {
    const expiredToken = makeJwt(
      { alg: "RS256" },
      { sub: "user_456", exp: Math.floor(Date.now() / 1000) - 7200 } // 2 hours ago
    );

    const res = parseJwt(expiredToken);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.expiryStatus?.state, "expired");
    assert.ok(res.expiryStatus?.label.includes("Expired"));
  });

  it("handles tokens without exp claim", () => {
    const noExpToken = makeJwt({ alg: "none" }, { sub: "static_token" });
    const res = parseJwt(noExpToken);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.expiryStatus?.state, "none");
  });

  it("returns an error for malformed token strings", () => {
    const res = parseJwt("invalid.jwt.token.parts");
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes("Invalid JWT format"));
  });

  it("flags a token with a future nbf as not-yet-valid, independent of exp", () => {
    const token = makeJwt(
      { alg: "HS256" },
      { sub: "user_789", nbf: Math.floor(Date.now() / 1000) + 3600, exp: Math.floor(Date.now() / 1000) + 7200 }
    );
    const res = parseJwt(token);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.expiryStatus?.state, "valid", "exp is still in the future");
    assert.strictEqual(res.nbfStatus?.state, "not-yet-valid", "nbf is in the future — token isn't usable yet");
  });

  it("marks a token with a past nbf as active", () => {
    const token = makeJwt({ alg: "HS256" }, { sub: "user_1", nbf: Math.floor(Date.now() / 1000) - 60 });
    const res = parseJwt(token);
    assert.strictEqual(res.nbfStatus?.state, "active");
  });
});
