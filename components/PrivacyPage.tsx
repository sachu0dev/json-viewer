"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { PORTFOLIO_URL, GITHUB_URL } from "@/lib/site";

// Kept in sync by hand with lib/analytics.ts's AnalyticsEvent union — this
// page's whole point is being an honest list, so if you add an event there,
// add its row here in the same edit.
const ANALYTICS_EVENTS: { name: string; whatItRecords: string }[] = [
  { name: "json_loaded", whatItRecords: "how the document arrived (paste/drop/recent/share/edit), its byte size, row count" },
  { name: "json_parse_failed", whatItRecords: "how it arrived, its byte size, the line number the parse error occurred on" },
  { name: "document_edited", whatItRecords: "byte size after the edit" },
  { name: "feature_used", whatItRecords: "which feature (e.g. \"minify\", \"repair\", \"convert\") — an enum label, not its input/output" },
  { name: "share_link_created", whatItRecords: "byte size of the document, length of the generated URL fragment" },
  { name: "share_link_opened", whatItRecords: "length of the incoming URL fragment" },
  { name: "compare_started", whatItRecords: "nothing beyond the event firing" },
  { name: "compare_completed", whatItRecords: "count of changed rows in the diff" },
  { name: "schema_validated", whatItRecords: "which JSON Schema draft, whether it passed, count of errors" },
  { name: "jwt_decoded", whatItRecords: "whether the token decoded successfully — never the token itself" },
  { name: "api_response_parsed", whatItRecords: "detected body kind (json/html/xml/text), the HTTP status code" },
  { name: "jsonl_processed", whatItRecords: "total record count, valid record count" },
  { name: "jsonpath_query_run", whatItRecords: "count of matches, whether it errored — never the expression or results" },
  { name: "converted", whatItRecords: "which conversion target (e.g. \"TypeScript\"), its category (code/data)" },
];

const LOCAL_STORAGE_ITEMS: { what: string; where: string }[] = [
  { what: "Recent files (full document text, for one-click reopen)", where: "IndexedDB, this browser only" },
  { what: "Saved JSON Schemas", where: "localStorage, this browser only" },
  { what: "JSONPath query history", where: "localStorage, this browser only" },
  { what: "Pinned tool shortcuts, theme, editor/format preferences", where: "localStorage, this browser only" },
];

export function PrivacyPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}>
      <header
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
      >
        <Link href="/" className="font-mono text-xs font-bold tracking-wider uppercase hover:opacity-80" style={{ color: theme.colors.accent }}>
          JSON VIEWER
        </Link>
        <Link href="/" className="font-mono text-xs hover:opacity-80 hover:underline" style={{ color: theme.colors.muted }}>
          ← Back to viewer
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Privacy &amp; local-first architecture</h1>
        <p className="mt-2 text-sm" style={{ color: theme.colors.muted }}>
          The short version: your JSON never leaves your browser. Below is exactly how, and exactly what the handful of
          analytics events do and don&apos;t record — not an aspirational claim, the real list.
        </p>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.accent }}>
            Where your document goes
          </h2>
          <div
            className="mt-3 flex flex-col items-center gap-2 rounded-lg border p-6 font-mono text-xs sm:flex-row sm:justify-center sm:gap-4"
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
          >
            <span className="rounded-full border px-3 py-1.5" style={{ borderColor: theme.colors.border }}>Your JSON</span>
            <span aria-hidden="true">→</span>
            <span className="rounded-full border px-3 py-1.5" style={{ borderColor: theme.colors.border }}>Your Browser</span>
            <span aria-hidden="true">→</span>
            <span
              className="rounded-full border px-3 py-1.5 font-semibold"
              style={{ borderColor: theme.colors.accent, color: theme.colors.accent }}
            >
              Web Worker
            </span>
            <span aria-hidden="true">→</span>
            <span className="rounded-full border px-3 py-1.5" style={{ borderColor: theme.colors.border }}>Result on screen</span>
          </div>
          <p className="mt-3 text-xs" style={{ color: theme.colors.muted }}>
            Parsing, formatting, diffing, repairing, converting, validating against a schema, decoding a JWT — every one
            of these runs inside a Web Worker in your browser tab. Notice there&apos;s no arrow pointing to a server in
            that diagram — none of these tools have a backend to send your document to. The parsed document itself is
            never sent as a network request, not even to this site&apos;s own servers.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.accent }}>
            What&apos;s stored on your device (and how to clear it)
          </h2>
          <p className="mt-2 text-xs" style={{ color: theme.colors.muted }}>
            A few conveniences — reopening a recent file, keeping a saved schema — need somewhere to live. Everything
            below stays on your device, in this browser, and syncs nowhere:
          </p>
          <ul className="mt-3 space-y-2">
            {LOCAL_STORAGE_ITEMS.map((item) => (
              <li
                key={item.what}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
                style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
              >
                <span style={{ color: theme.colors.fg }}>{item.what}</span>
                <span className="shrink-0 font-mono opacity-70" style={{ color: theme.colors.muted }}>
                  {item.where}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs" style={{ color: theme.colors.muted }}>
            Every one of these has its own one-click clear (recent files, saved schemas, query history — each list has
            a Clear action), or wipe all of it at once from{" "}
            <span className="font-mono" style={{ color: theme.colors.fg }}>
              Settings → Privacy → Clear local data
            </span>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.accent }}>
            What analytics does and doesn&apos;t record
          </h2>
          <p className="mt-2 text-xs" style={{ color: theme.colors.muted }}>
            This site uses Google Analytics (GA4) for basic usage counts — which features get used, how often people
            hit a parse error. Every event below is metadata <em>about</em> your document (a byte count, a line
            number, an enum label) — never its keys, values, paths, or content. This is the complete, current list;
            it&apos;s generated by hand from the same source file the app itself imports events from.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: theme.colors.border }}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ backgroundColor: theme.colors.panel }}>
                  <th className="px-3 py-2 font-mono font-semibold" style={{ color: theme.colors.accent }}>
                    Event
                  </th>
                  <th className="px-3 py-2 font-semibold" style={{ color: theme.colors.muted }}>
                    What it records
                  </th>
                </tr>
              </thead>
              <tbody>
                {ANALYTICS_EVENTS.map((e, i) => (
                  <tr key={e.name} style={{ backgroundColor: i % 2 === 0 ? theme.colors.bg : theme.colors.panel }}>
                    <td className="px-3 py-2 align-top font-mono whitespace-nowrap" style={{ color: theme.colors.fg }}>
                      {e.name}
                    </td>
                    <td className="px-3 py-2 align-top" style={{ color: theme.colors.muted }}>
                      {e.whatItRecords}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.accent }}>
            Source
          </h2>
          <p className="mt-2 text-xs" style={{ color: theme.colors.muted }}>
            This isn&apos;t a policy document written separately from the code — it describes{" "}
            <code>lib/analytics.ts</code> and <code>workers/json.worker.ts</code> as they actually are. The project is
            open source:{" "}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.colors.accent }}>
              read the code yourself
            </a>
            . Built by{" "}
            <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.colors.accent }}>
              devure.in
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
