"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ViewerAppContent } from "@/components/ViewerApp";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { PORTFOLIO_URL, GITHUB_URL } from "@/lib/site";
import { listPinnedTools, togglePinnedTool } from "@/lib/pinned-tools";

export const FEATURE_LINKS = [
  { label: "JSONPath", href: "/jsonpath", icon: "🔍" },
  { label: "JSONL Mode", href: "/jsonl-viewer", icon: "📜" },
  { label: "JSON Diff", href: "/json-diff", icon: "🔀" },
  { label: "Schema Validator", href: "/json-schema-validator", icon: "🧬" },
  { label: "JWT Decoder", href: "/jwt-decoder", icon: "🔑" },
  { label: "API Inspector", href: "/api-response", icon: "📡" },
  { label: "Large Files", href: "/large-files", icon: "🗂️" },
  { label: "TypeScript", href: "/json-to-typescript", icon: "🔷" },
  { label: "Python", href: "/json-to-python", icon: "🐍" },
  { label: "Go", href: "/json-to-go", icon: "🐹" },
  { label: "Rust", href: "/json-to-rust", icon: "🦀" },
  { label: "Java", href: "/json-to-java", icon: "☕" },
  { label: "C#", href: "/json-to-csharp", icon: "🎯" },
  { label: "Swift", href: "/json-to-swift", icon: "🐦" },
  { label: "JavaScript", href: "/json-to-javascript", icon: "🟨" },
  { label: "CSV", href: "/json-to-csv", icon: "📊" },
  { label: "YAML", href: "/json-to-yaml", icon: "📋" },
  { label: "XML", href: "/json-to-xml", icon: "🏷️" },
  { label: "TOML", href: "/json-to-toml", icon: "⚙️" },
  { label: "SQL", href: "/json-to-sql", icon: "🗄️" },
];

function ToolPageInner({ heading, children, seoContent }: { heading: string; children: ReactNode; seoContent?: ReactNode }) {
  const [active, setActive] = useState(false);
  const { theme } = useTheme();
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    // Deferred via microtask — localStorage isn't available during SSR, so
    // the pre-hydration render must match on both sides (empty), then pick
    // up real pins right after mount.
    queueMicrotask(() => setPinned(listPinnedTools()));
  }, []);

  function handleTogglePin(e: React.MouseEvent, href: string) {
    e.preventDefault();
    e.stopPropagation();
    setPinned(togglePinnedTool(href));
  }

  const pinnedLinks = FEATURE_LINKS.filter((l) => pinned.includes(l.href));

  const introSlot = (
    <div
      className="overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none"
      style={{ maxHeight: active ? "0px" : "440px" }}
    >
      <div className="mx-auto max-w-4xl px-6 pb-4 pt-6 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{heading}</h1>
        <p className="mt-1.5 text-xs sm:text-sm max-w-2xl mx-auto opacity-80" style={{ color: theme.colors.muted }}>
          {children}
        </p>

        {pinnedLinks.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-60" style={{ color: theme.colors.muted }}>
              📌 Pinned
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {pinnedLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono font-semibold transition-all hover:scale-105"
                  style={{ backgroundColor: theme.colors.active, borderColor: theme.colors.accent, color: theme.colors.accent }}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                  <button
                    onClick={(e) => handleTogglePin(e, item.href)}
                    className="opacity-70 hover:opacity-100"
                    aria-label={`Unpin ${item.label}`}
                    title="Unpin"
                  >
                    ★
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {FEATURE_LINKS.map((item) => {
            const isPinned = pinned.includes(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="group flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: theme.colors.panel,
                  borderColor: theme.colors.border,
                  color: theme.colors.fg,
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
                <button
                  onClick={(e) => handleTogglePin(e, item.href)}
                  className="opacity-0 transition-opacity group-hover:opacity-70 hover:opacity-100!"
                  style={{ color: isPinned ? theme.colors.accent : theme.colors.muted }}
                  aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label} for quick access`}
                  title={isPinned ? "Unpin" : "Pin for quick access"}
                >
                  {isPinned ? "★" : "☆"}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Pages with seoContent grow taller than one viewport, so the tool gets a
  // fixed h-dvh block of its own and the footer moves below the extra
  // content. Pages without it keep the original fit-to-viewport layout
  // (tool as flex-1, footer immediately after it, no scroll needed) —
  // otherwise the footer would sit one empty scroll below the fold for no
  // reason on every page that has nothing to show below the tool.
  return (
    <div
      className={seoContent ? "flex min-h-dvh w-full flex-col" : "flex h-dvh w-full flex-col"}
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
    >
      <div className={seoContent ? "h-dvh w-full shrink-0" : "min-h-0 flex-1"}>
        <ViewerAppContent onActiveChange={setActive} headerSlot={introSlot} />
      </div>

      {seoContent}

      <footer
        className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t px-4 py-3 font-mono text-[11px]"
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
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className="hover:underline" style={{ color: theme.colors.accent }}>
          🔒 Privacy
        </Link>
      </footer>
    </div>
  );
}

export function ToolPage({ heading, children, seoContent }: { heading: string; children: ReactNode; seoContent?: ReactNode }) {
  return (
    <ThemeProvider>
      <ToolPageInner heading={heading} seoContent={seoContent}>
        {children}
      </ToolPageInner>
    </ThemeProvider>
  );
}
