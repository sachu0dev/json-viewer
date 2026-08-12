"use client";

import { forwardRef, useState, useImperativeHandle, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { SearchOptions } from "@/lib/json-document";

export interface SearchBarHandle {
  focus: () => void;
  blur: () => void;
  toggleReplace: () => void;
}

export const SearchBar = forwardRef<
  SearchBarHandle,
  {
    matchCount: number;
    activeMatchIndex: number;
    activeMatchPath?: string | null;
    isInvalidRegex?: boolean;
    rawText?: string;
    canReplace?: boolean;
    /** All matching paths — for result list */
    allMatches?: string[];
    onQueryChange: (query: string, opts: SearchOptions) => void;
    onNext: () => void;
    onPrev: () => void;
    onReplace?: (newText: string) => void;
    onReplaceAll?: (find: string, replace: string, opts: SearchOptions) => void;
    onRevealPath?: (path: string) => void;
  }
>(function SearchBar(
  { matchCount, activeMatchIndex, activeMatchPath, isInvalidRegex, canReplace, allMatches = [], onQueryChange, onNext, onPrev, onReplace, onReplaceAll, onRevealPath },
  ref
) {
  const [value, setValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [scope, setScope] = useState<NonNullable<SearchOptions["scope"]>>("all");
  const [exactMatch, setExactMatch] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    toggleReplace: () => setReplaceOpen((o) => !o),
  }));

  const showError = isInvalidRegex && value.length > 0;

  function buildOpts(
    cs = caseSensitive,
    rx = isRegex,
    sc = scope,
    ex = exactMatch,
  ): SearchOptions {
    return { caseSensitive: cs, isRegex: rx, scope: sc, exactMatch: ex };
  }

  function handleChange(
    newValue: string,
    newCS = caseSensitive,
    newRx = isRegex,
    newScope = scope,
    newExact = exactMatch,
  ) {
    setValue(newValue);
    onQueryChange(newValue, buildOpts(newCS, newRx, newScope, newExact));
  }

  const toggleBtnStyle = (active: boolean) => ({
    backgroundColor: active ? `${theme.colors.accent}30` : "transparent",
    color: active ? theme.colors.accent : theme.colors.muted,
    border: `1px solid ${active ? theme.colors.accent : "transparent"}`,
  });

  const actionBtnStyle = {
    backgroundColor: theme.colors.hover,
    color: theme.colors.fg,
    border: `1px solid ${theme.colors.border}`,
    fontSize: "11px",
    fontFamily: "monospace",
    padding: "2px 8px",
    borderRadius: "4px",
    transition: "opacity 0.15s",
  } as const;

  const SCOPE_OPTIONS: { value: NonNullable<SearchOptions["scope"]>; label: string }[] = [
    { value: "all", label: "All" },
    { value: "keys", label: "Keys" },
    { value: "values", label: "Values" },
    { value: "paths", label: "Paths" },
  ];

  const displayedMatches = allMatches.slice(0, 50);
  const hiddenCount = allMatches.length - displayedMatches.length;

  return (
    <div
      className="flex flex-col transition-colors"
      style={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.panel,
      }}
    >
      {/* Search row */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        {/* Replace toggle caret */}
        <button
          type="button"
          onClick={() => setReplaceOpen((o) => !o)}
          title={replaceOpen ? "Hide replace" : "Show replace (Ctrl+Alt+F)"}
          className="flex h-5 w-4 items-center justify-center rounded text-[10px] transition-colors opacity-50 hover:opacity-100"
          style={{ color: theme.colors.muted }}
          aria-expanded={replaceOpen}
        >
          {replaceOpen ? "▾" : "▸"}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder="Search… ( / or Ctrl+F )"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
          style={{ color: showError ? theme.colors.diffRemoved : theme.colors.fg }}
          onChange={(e) => handleChange(e.target.value)}
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

        {/* Scope selector */}
        <div className="hidden sm:flex items-center rounded overflow-hidden" style={{ border: `1px solid ${theme.colors.border}` }}>
          {SCOPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setScope(o.value);
                handleChange(value, caseSensitive, isRegex, o.value, exactMatch);
              }}
              title={`Search ${o.label.toLowerCase()}`}
              className="px-1.5 py-0.5 text-[10px] font-mono transition-colors"
              style={{
                backgroundColor: scope === o.value ? `${theme.colors.accent}25` : "transparent",
                color: scope === o.value ? theme.colors.accent : theme.colors.muted,
                fontWeight: scope === o.value ? 700 : 400,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Exact toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !exactMatch;
            setExactMatch(next);
            handleChange(value, caseSensitive, isRegex, scope, next);
          }}
          title={exactMatch ? "Exact match: ON (click for partial)" : "Exact match: OFF (click for exact)"}
          aria-pressed={exactMatch}
          className="hidden sm:flex h-6 items-center justify-center rounded px-1.5 font-mono text-[10px] transition-colors"
          style={toggleBtnStyle(exactMatch)}
        >
          =
        </button>

        {/* Case sensitive toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !caseSensitive;
            setCaseSensitive(next);
            handleChange(value, next, isRegex);
          }}
          title={caseSensitive ? "Case-sensitive: ON" : "Case-sensitive: OFF"}
          aria-pressed={caseSensitive}
          className="flex h-6 w-6 items-center justify-center rounded font-mono text-[11px] font-bold transition-colors"
          style={toggleBtnStyle(caseSensitive)}
        >
          Aa
        </button>

        {/* Regex toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !isRegex;
            setIsRegex(next);
            handleChange(value, caseSensitive, next);
          }}
          title={isRegex ? "Regex: ON" : "Regex: OFF"}
          aria-pressed={isRegex}
          className="flex h-6 items-center justify-center rounded px-1.5 font-mono text-[11px] transition-colors"
          style={toggleBtnStyle(isRegex)}
        >
          .*
        </button>

        {matchCount > 0 && activeMatchPath && !showError && (
          <span
            className="max-w-40 truncate rounded px-2 py-0.5 font-mono text-[11px] font-medium hidden sm:inline-block"
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
          {showError ? (
            <span className="shrink-0 font-mono text-xs font-medium" style={{ color: theme.colors.diffRemoved }}>
              Invalid regex
            </span>
          ) : (
            <span className="shrink-0 font-mono text-xs font-medium" style={{ color: theme.colors.muted }}>
              {value.length > 0
                ? matchCount > 0
                  ? `${activeMatchIndex + 1} of ${matchCount}`
                  : "No results"
                : ""}
            </span>
          )}

          {/* Show result list toggle */}
          {matchCount > 1 && !showError && (
            <button
              type="button"
              onClick={() => setShowResults((o) => !o)}
              title={showResults ? "Hide result list" : "Show all matches"}
              className="flex h-6 items-center justify-center rounded px-1.5 font-mono text-[10px] transition-colors"
              style={toggleBtnStyle(showResults)}
              aria-pressed={showResults}
            >
              ≡
            </button>
          )}

          <button
            type="button"
            onClick={onPrev}
            disabled={matchCount === 0 || showError}
            title="Previous match (Shift+Enter or ↑)"
            className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-30"
            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
          >
            ▲
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={matchCount === 0 || showError}
            title="Next match (Enter or ↓)"
            className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-30"
            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Replace row */}
      {replaceOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 pl-8">
          <input
            type="text"
            value={replaceValue}
            placeholder="Replace with…"
            className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
            style={{ color: theme.colors.fg }}
            onChange={(e) => setReplaceValue(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            disabled={!canReplace || matchCount === 0 || showError}
            onClick={() => onReplace?.(replaceValue)}
            title="Replace current match"
            style={{ ...actionBtnStyle, opacity: !canReplace || matchCount === 0 ? 0.4 : 1 }}
          >
            Replace
          </button>
          <button
            type="button"
            disabled={!canReplace || matchCount === 0 || showError}
            onClick={() => onReplaceAll?.(value, replaceValue, buildOpts())}
            title="Replace all matches"
            style={{ ...actionBtnStyle, opacity: !canReplace || matchCount === 0 ? 0.4 : 1 }}
          >
            Replace all
          </button>
        </div>
      )}

      {/* Collapsible result list */}
      {showResults && matchCount > 0 && !showError && (
        <div
          className="max-h-48 overflow-y-auto border-t"
          style={{ borderColor: theme.colors.border }}
          role="listbox"
          aria-label="Search results"
        >
          {displayedMatches.map((path, i) => (
            <button
              key={path}
              type="button"
              role="option"
              aria-selected={path === activeMatchPath}
              onClick={() => onRevealPath?.(path)}
              className="flex w-full items-center gap-2 px-4 py-1 text-left font-mono text-[11px] transition-colors hover:opacity-80"
              style={{
                backgroundColor: path === activeMatchPath ? `${theme.colors.accent}20` : i % 2 === 0 ? `${theme.colors.hover}50` : "transparent",
                color: path === activeMatchPath ? theme.colors.accent : theme.colors.muted,
                borderBottom: `1px solid ${theme.colors.border}20`,
              }}
            >
              <span style={{ color: theme.colors.muted, minWidth: "2ch", textAlign: "right", opacity: 0.5 }}>{i + 1}</span>
              <span className="truncate">{path}</span>
            </button>
          ))}
          {hiddenCount > 0 && (
            <div className="px-4 py-1 text-[11px] font-mono" style={{ color: theme.colors.muted, opacity: 0.6 }}>
              …and {hiddenCount} more
            </div>
          )}
        </div>
      )}
    </div>
  );
});
