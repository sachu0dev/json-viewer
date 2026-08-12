"use client";

import { forwardRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

export const SearchBar = forwardRef<
  HTMLInputElement,
  {
    matchCount: number;
    activeMatchIndex: number;
    activeMatchPath?: string | null;
    onQueryChange: (query: string) => void;
    onNext: () => void;
    onPrev: () => void;
  }
>(function SearchBar({ matchCount, activeMatchIndex, activeMatchPath, onQueryChange, onNext, onPrev }, ref) {
  const [value, setValue] = useState("");
  const { theme } = useTheme();

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 transition-colors"
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.panel,
      }}
    >
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder="Search keys and values ( press / to focus )"
        className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
        style={{ color: theme.colors.fg }}
        onChange={(e) => {
          setValue(e.target.value);
          onQueryChange(e.target.value);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) onPrev();
            else onNext();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onNext();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            onPrev();
          } else if (e.key === "Escape") {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />

      {matchCount > 0 && activeMatchPath && (
        <span
          className="max-w-50 truncate rounded px-2 py-0.5 font-mono text-[11px] font-medium"
          style={{
            backgroundColor: `${theme.colors.accent}25`,
            color: theme.colors.accent,
            borderColor: theme.colors.accent,
            borderWidth: "1px",
            borderStyle: "solid",
          }}
          title={activeMatchPath}
        >
          {activeMatchPath}
        </span>
      )}

      <div className="flex items-center gap-1.5">
        <span className="shrink-0 font-mono text-xs font-medium" style={{ color: theme.colors.muted }}>
          {matchCount > 0 ? `${activeMatchIndex + 1} of ${matchCount}` : "No results"}
        </span>

        <button
          type="button"
          onClick={onPrev}
          disabled={matchCount === 0}
          title="Previous match (Shift+Enter or Up Arrow)"
          className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-30"
          style={{
            backgroundColor: theme.colors.hover,
            color: theme.colors.fg,
          }}
        >
          ▲
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={matchCount === 0}
          title="Next match (Enter or Down Arrow)"
          className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-30"
          style={{
            backgroundColor: theme.colors.hover,
            color: theme.colors.fg,
          }}
        >
          ▼
        </button>
      </div>
    </div>
  );
});
