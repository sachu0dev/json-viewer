# Phase 4 — Advanced Developer Tools

Source: [VISION.md](./VISION.md) §46 Phase 4, §10 (JSON Schema), §14 (JWT Decoder), §32 (API Response Mode)

**Status: 0% shipped.**

## Remaining work

- [ ] **JSON Schema tool** (§10) — validate JSON against a schema, error tree with path/expected/actual type.
  - Placement: dedicated page `/json-schema-validator`, two-pane layout per §10 (JSON input, schema input, validate action, error tree output), plus reachable from the main tool via a "Validate against schema" toolbar action for the loaded document.
  - Deliverable checklist (DoD): exact §10 error format (`/users/0/email`, `Expected: string`, `Received: number`); errors are human-explained, not raw validator output — apply the same §29 error-UX philosophy already required for parse errors; supports common JSON Schema draft versions "where practical" (§10's own hedge — pick and document which draft(s), don't silently support a subset while claiming full support, per §13's honesty requirement extended here); large-schema/large-document validation still routes through the worker.
  - Check whether an existing well-maintained validator (e.g. one supporting a recent JSON Schema draft) is worth adding as a dependency (Rule 8) before hand-rolling a validator — this is one case where hand-rolling is likely the wrong call given schema-spec complexity.
  - Competitive bar: see [competitive-bar.md](./competitive-bar.md) "JSON Schema" row — jsonschemavalidator.net's errors are terse; Devure's differentiator is applying the existing human-readable error pattern here too.

- [ ] **JWT decoder** (§14) — decode header/payload/signature, show claims, expiry status.
  - Placement: dedicated page `/jwt-decoder`, three-panel layout per §14 (Header / Payload / Signature), with paste-a-token as the sole input (no separate upload flow needed — tokens are pasted, not uploaded as files).
  - Deliverable checklist (DoD): decodes Base64URL, surfaces claims (exp, iat, iss, sub, aud) individually, not just raw payload JSON; expiry state shown as one of `Expired` / `Valid` / `Expires in 2h` per §14's exact example; **must** display the doc's required disclaimer verbatim: "Decoding a JWT does not verify its signature."; must never send JWT contents off-device — pure client-side, matches existing local-first pattern (`lib/share.ts` already does client-side-only encoding, follow that precedent); analytics only logs `jwt_decoder_used`-style action events, never the token itself (§19, §44, Rule 11).
  - Competitive bar: see [competitive-bar.md](./competitive-bar.md) "JWT decoder" row — jwt.io is the trusted reference; match decode/claims/expiry UX, but signature verification is explicitly out of spec here (decode-only) — don't silently scope-creep into verification later without a deliberate decision.

- [ ] **API response mode** (§32) — paste an HTTP response, split into status/headers/body, pretty-print the JSON body.
  - Placement: own page or a mode toggle on the main tool (decide based on how often it's used standalone vs. as an entry point into the regular viewer — default to a dedicated page since it has distinct input shape, per §1's IA putting it under "Developer Utilities").
  - Deliverable checklist (DoD): parses raw HTTP response text into status line, headers list, and body; if the body is JSON, hands off into the existing viewer/tree (Rule 3: don't rebuild a second JSON viewer for this mode); non-JSON bodies show a clear "not JSON" state rather than erroring.

- [ ] **JSONPath depends on Phase 2** — this phase's "Advanced JSONPath" and "Query playground" bullets extend the Phase-2 JSONPath tool; don't start these until [phase-2](./phase-2-professional-toolkit.md)'s JSONPath item ships.

- [ ] **Keyboard/command-palette integration (Rule 15):** add "Open JSON Schema", "Decode JWT", "Open API Response Mode" palette entries as each tool ships. No dedicated global shortcuts named in the doc for these — palette access is sufficient.

## Notes

- JWT and Schema tools are both "trust nothing off-device" features — same privacy bar as the rest of the app (§19, §44). No network calls, no analytics on payload contents.
