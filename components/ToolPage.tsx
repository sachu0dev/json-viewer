"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ViewerAppContent } from "@/components/ViewerApp";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { PORTFOLIO_URL, GITHUB_URL } from "@/lib/site";

const FEATURE_LINKS = [
  { label: "JSONPath", href: "/jsonpath" },
  { label: "JSONL Mode", href: "/jsonl-viewer" },
  { label: "JSON Diff", href: "/json-diff" },
  { label: "Large Files", href: "/large-files" },
  { label: "TypeScript", href: "/json-to-typescript" },
  { label: "Python", href: "/json-to-python" },
  { label: "Go", href: "/json-to-go" },
  { label: "Rust", href: "/json-to-rust" },
  { label: "Java", href: "/json-to-java" },
  { label: "C#", href: "/json-to-csharp" },
  { label: "Swift", href: "/json-to-swift" },
  { label: "JavaScript", href: "/json-to-javascript" },
  { label: "CSV", href: "/json-to-csv" },
  { label: "YAML", href: "/json-to-yaml" },
  { label: "XML", href: "/json-to-xml" },
  { label: "TOML", href: "/json-to-toml" },
  { label: "SQL", href: "/json-to-sql" },
];

function ToolPageInner({ heading, children }: { heading: string; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const { theme } = useTheme();

  const introSlot = (
    <div
      className="overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none"
      style={{ maxHeight: active ? "0px" : "360px" }}
    >
      <div className="mx-auto max-w-4xl px-6 pb-4 pt-6 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{heading}</h1>
        <p className="mt-1.5 text-xs sm:text-sm max-w-2xl mx-auto opacity-80" style={{ color: theme.colors.muted }}>
          {children}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {FEATURE_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: theme.colors.panel,
                borderColor: theme.colors.border,
                color: theme.colors.fg,
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-dvh w-full flex-col"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
    >
      <div className="min-h-0 flex-1">
        <ViewerAppContent onActiveChange={setActive} headerSlot={introSlot} />
      </div>

      <footer
        className="flex shrink-0 items-center justify-center gap-3 border-t px-4 py-1.5 font-mono text-[11px]"
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel, color: theme.colors.muted }}
      >
        <span>
          Organization:{" "}
          <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.colors.accent }}>
            devure.in
          </a>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Owner:{" "}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.colors.accent }}>
            sachu0dev
          </a>
        </span>
      </footer>
    </div>
  );
}

export function ToolPage({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToolPageInner heading={heading}>{children}</ToolPageInner>
    </ThemeProvider>
  );
}
