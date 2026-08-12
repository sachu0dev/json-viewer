"use client";

import { useState, type ReactNode } from "react";
import { ViewerAppContent } from "@/components/ViewerApp";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { PORTFOLIO_URL, GITHUB_URL } from "@/lib/site";

function ToolPageInner({ heading, children }: { heading: string; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const { theme } = useTheme();

  // SEO/first-impression copy, rendered between the persistent nav bar and the
  // rest of the app. Collapses via max-height (grid-template-rows: 0fr/1fr
  // only shrinks a track when the grid container itself has a definite
  // height — this one is auto-sized by its content, so that trick silently
  // no-ops here) so it animates away once the editor is in use.
  const introSlot = (
    <div
      className="overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none"
      style={{ maxHeight: active ? "0px" : "220px" }}
    >
      <div className="mx-auto max-w-2xl px-6 pb-6 pt-8 text-center">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="mt-2 text-sm" style={{ color: theme.colors.muted }}>
          {children}
        </p>
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
