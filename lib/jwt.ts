export interface DecodedJwt {
  rawToken: string;
  valid: boolean;
  error?: string;
  header?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  signature?: string;
  claims?: {
    exp?: number;
    iat?: number;
    nbf?: number;
    iss?: string;
    sub?: string;
    aud?: string | string[];
  };
  expiryStatus?: {
    state: "valid" | "expired" | "none";
    label: string;
    humanTime?: string;
  };
  /** Independent of expiry — a token can be both not-yet-valid AND unexpired. */
  nbfStatus?: {
    state: "not-yet-valid" | "active" | "none";
    label: string;
    humanTime?: string;
  };
}

/**
 * Safely decodes a Base64URL string (RFC 7515).
 */
export function decodeBase64Url(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  try {
    // Decoding UTF-8 characters safely
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    // Fallback for standard atob
    return atob(base64);
  }
}

/**
 * Parses and inspects a JWT token client-side without network calls (§14).
 */
export function parseJwt(token: string): DecodedJwt {
  const trimmed = token.trim();
  if (!trimmed) {
    return { rawToken: trimmed, valid: false, error: "Please enter a JWT token string." };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return {
      rawToken: trimmed,
      valid: false,
      error: "Invalid JWT format. A valid JWT contains exactly 3 parts separated by dots (header.payload.signature).",
    };
  }

  try {
    const headerJson = JSON.parse(decodeBase64Url(parts[0]));
    const payloadJson = JSON.parse(decodeBase64Url(parts[1]));
    const signature = parts[2];

    const claims = {
      exp: typeof payloadJson.exp === "number" ? payloadJson.exp : undefined,
      iat: typeof payloadJson.iat === "number" ? payloadJson.iat : undefined,
      nbf: typeof payloadJson.nbf === "number" ? payloadJson.nbf : undefined,
      iss: typeof payloadJson.iss === "string" ? payloadJson.iss : undefined,
      sub: typeof payloadJson.sub === "string" ? payloadJson.sub : undefined,
      aud: payloadJson.aud,
    };

    // Calculate expiry status
    let expiryStatus: DecodedJwt["expiryStatus"] = { state: "none", label: "No expiration set (no 'exp' claim)" };

    if (claims.exp) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const diffSeconds = claims.exp - nowSeconds;
      const expDate = new Date(claims.exp * 1000).toLocaleString();

      if (diffSeconds <= 0) {
        const agoMins = Math.floor(Math.abs(diffSeconds) / 60);
        const agoHours = Math.floor(agoMins / 60);
        const timeAgo = agoHours > 0 ? `${agoHours}h ${agoMins % 60}m ago` : `${agoMins}m ago`;
        expiryStatus = {
          state: "expired",
          label: `Expired (${timeAgo})`,
          humanTime: expDate,
        };
      } else {
        const inMins = Math.floor(diffSeconds / 60);
        const inHours = Math.floor(inMins / 60);
        const timeIn = inHours > 0 ? `${inHours}h ${inMins % 60}m` : `${inMins}m`;
        expiryStatus = {
          state: "valid",
          label: `Valid (Expires in ${timeIn})`,
          humanTime: expDate,
        };
      }
    }

    // "Not before" — a separate validity window from expiry. A token with a
    // future `nbf` isn't usable yet even if `exp` is fine; the old UI parsed
    // this claim and never surfaced it, so a not-yet-valid token displayed
    // identically to a currently-valid one.
    let nbfStatus: DecodedJwt["nbfStatus"] = { state: "none", label: "No 'not before' claim" };
    if (claims.nbf) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const nbfDate = new Date(claims.nbf * 1000).toLocaleString();
      if (claims.nbf > nowSeconds) {
        const inMins = Math.floor((claims.nbf - nowSeconds) / 60);
        const inHours = Math.floor(inMins / 60);
        const timeIn = inHours > 0 ? `${inHours}h ${inMins % 60}m` : `${inMins}m`;
        nbfStatus = { state: "not-yet-valid", label: `Not valid yet (active in ${timeIn})`, humanTime: nbfDate };
      } else {
        nbfStatus = { state: "active", label: "Active window started", humanTime: nbfDate };
      }
    }

    return {
      rawToken: trimmed,
      valid: true,
      header: headerJson,
      payload: payloadJson,
      signature,
      claims,
      expiryStatus,
      nbfStatus,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid Base64 or JSON structure";
    return {
      rawToken: trimmed,
      valid: false,
      error: `Failed to decode JWT: ${message}`,
    };
  }
}
