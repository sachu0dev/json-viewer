# Scope

This tool stays a fast, local-first JSON viewer/diff/search workspace — no
accounts, no server, nothing you paste ever leaves the browser. That's the
whole differentiation; features that require a server or an account belong in
a different project.

Issues that will get fixed: parsing bugs, crashes on large/malformed input,
performance regressions, accessibility bugs.

Issues that won't be accepted as-is: new file-format support (YAML/TOML/XML
conversion), a query/transform language, schema validation across multiple
JSON Schema drafts. These are real features with real ongoing maintenance
cost — open an issue to discuss before sending a PR for one.
