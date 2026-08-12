# Contributing

## Scope

This stays a fast, local-first JSON workspace — no accounts, no server,
nothing pasted in ever leaves the browser. That's the whole
differentiation; features that require a server or an account belong in a
different project.

Issues that will get fixed: parsing bugs, crashes on large/malformed
input, incorrect converter output, performance regressions, accessibility
bugs, broken SEO/metadata.

New tools/converters/formats are real features with ongoing maintenance
cost — open an issue to discuss scope and approach before sending a PR
for one, rather than showing up with a large unsolicited diff.

## Before you send a PR

```bash
npm install
npm run lint
npm test
npm run build
```

All four should pass. If you're touching a converter (`lib/converters/*`)
or `lib/schema-validator.ts`, add/update a case in the matching
`*.test.ts` file — these are the only regression guard for correctness
bugs like duplicate types or malformed output.

Keep PRs scoped to one fix or feature. Don't mix formatting-only changes
with behavior changes in the same PR.

## License note

By submitting a contribution, you agree it's licensed under this
project's [PolyForm Noncommercial License 1.0.0](LICENSE) — same terms as
the rest of the codebase.
