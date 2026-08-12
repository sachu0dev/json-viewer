"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { FEATURE_LINKS } from "./ToolPage";

const FEATURE_GROUPS: { title: string; hrefs: string[] }[] = [
  { title: "Core tools", hrefs: ["/jsonpath", "/jsonl-viewer", "/json-diff", "/large-files"] },
  { title: "Developer utilities", hrefs: ["/json-schema-validator", "/jwt-decoder", "/api-response"] },
  {
    title: "Code generators",
    hrefs: [
      "/json-to-typescript",
      "/json-to-python",
      "/json-to-go",
      "/json-to-rust",
      "/json-to-java",
      "/json-to-csharp",
      "/json-to-swift",
      "/json-to-javascript",
    ],
  },
  { title: "Format converters", hrefs: ["/json-to-csv", "/json-to-yaml", "/json-to-xml", "/json-to-toml", "/json-to-sql"] },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is this JSON viewer really free, and does my data get uploaded anywhere?",
    a: "Yes, entirely free, and no. Every tool on this site — the viewer, the formatter, JSONPath, the schema validator, the converters — runs inside a Web Worker in your browser tab. There's no upload step, because there's no server that receives your document. See /privacy for the exact architecture and the full list of what the small amount of local analytics does and doesn't record.",
  },
  {
    q: "Can it handle large JSON files without freezing the tab?",
    a: "Yes — parsing runs in a Web Worker and the tree view is virtualized, so only the rows actually on screen get rendered. The /large-files page is built and tested specifically for multi-megabyte documents that choke most browser-based JSON viewers.",
  },
  {
    q: "What JSON Schema drafts does the validator support?",
    a: "Draft-07, 2019-09, and 2020-12, auto-detected from the schema's own $schema field (or pick one explicitly). Errors are humanized — 'Expected string, received number' at /users/0/email, not raw Ajv output — and you can infer a starting schema directly from a JSON sample.",
  },
  {
    q: "Which languages and formats can I convert JSON to?",
    a: "TypeScript, Python (Pydantic/dataclass/TypedDict), Go, Rust, Java, C#, Swift, and JavaScript for code generation; CSV, YAML, XML, TOML, and SQL for data/config formats. Each has its own dedicated page with live options and a downloadable file.",
  },
  {
    q: "Does the JWT decoder verify the signature?",
    a: "No, by design — it decodes the header and payload and surfaces every standard claim (exp, iat, nbf, iss, sub, aud) plus expiry/not-before status, but signature verification needs the signing key, which this tool never asks for. That's the same decode-only scope jwt.io uses.",
  },
  {
    q: "Does this work offline or need an account?",
    a: "No account, ever — there's nothing to sign up for. The tool works over a normal page load; a dedicated offline/installable mode is on the roadmap but not shipped yet.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export function HomepageSeoContent() {
  const { theme } = useTheme();

  return (
    <div style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-center text-lg font-bold tracking-tight sm:text-xl">
          One workspace instead of five tabs
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm" style={{ color: theme.colors.muted }}>
          Most JSON tools do one thing — format, or diff, or convert to one language — and send your data through
          their server to do it. Devure JSON does all of it, entirely in your browser, in one place.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            { icon: "🗂️", title: "Handles files that freeze other viewers", body: "Worker-based parsing + a virtualized tree means multi-MB documents stay responsive instead of locking the tab." },
            { icon: "🔒", title: "Nothing you paste ever leaves your browser", body: "Parsing, diffing, converting, schema validation, JWT decoding — all local. No account, no upload step, no server round-trip." },
            { icon: "🧬", title: "A real schema validator, not a toy", body: "Draft-07/2019-09/2020-12 auto-detected, human-readable errors, infer-a-schema-from-JSON, save/load named schemas, a built-in regex tester." },
            { icon: "🔀", title: "Code generation that doesn't lose edge cases", body: "Mixed-shape arrays merge into one correct type instead of duplicating interfaces — verified against quicktype-style test cases, not just the happy path." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3 rounded-lg border p-4" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}>
              <span className="text-xl" aria-hidden="true">{f.icon}</span>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-xs" style={{ color: theme.colors.muted }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t px-6 py-14" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-lg font-bold tracking-tight sm:text-xl">Every tool, one click away</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.accent }}>
                  {group.title}
                </h3>
                <ul className="mt-2.5 space-y-1.5">
                  {group.hrefs.map((href) => {
                    const item = FEATURE_LINKS.find((f) => f.href === href);
                    if (!item) return null;
                    return (
                      <li key={href}>
                        <Link href={href} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: theme.colors.fg }}>
                          <span aria-hidden="true">{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="text-center text-lg font-bold tracking-tight sm:text-xl">Frequently asked questions</h2>
        <div className="mt-8 space-y-5">
          {FAQS.map((f) => (
            <div key={f.q}>
              <h3 className="text-sm font-semibold">{f.q}</h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.colors.muted }}>{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs" style={{ color: theme.colors.muted }}>
          Full keyboard reference: press <kbd className="rounded border px-1.5 py-0.5 font-mono" style={{ borderColor: theme.colors.border }}>?</kbd> anywhere
          in the app, or open the <Link href="/privacy" className="hover:underline" style={{ color: theme.colors.accent }}>privacy page</Link> to see exactly
          how the local-first architecture works.
        </p>
      </section>
    </div>
  );
}
