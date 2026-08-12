"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

/**
 * Collapsing title+description block, shared by every tool page. Starts
 * expanded; collapses to 0 height (smoothly, via max-height) the moment the
 * caller says the user has actually engaged with the tool, so the tool gets
 * the full viewport without the user having to scroll past marketing copy
 * once they're working. Same mechanic ToolPage.tsx already used for the
 * main viewer — generalized here so every tool page (not just /) gets it.
 */
export function ToolIntro({
  heading,
  active,
  maxHeight = 320,
  children,
}: {
  heading: string;
  active: boolean;
  maxHeight?: number;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <div
      className="shrink-0 overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none"
      style={{ maxHeight: active ? "0px" : `${maxHeight}px` }}
    >
      <div className="mx-auto max-w-3xl px-4 pb-3 pt-3 text-center">
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">{heading}</h1>
        <p
          className="mx-auto mt-1.5 max-w-2xl text-xs opacity-80 sm:text-sm"
          style={{ color: theme.colors.muted }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}
