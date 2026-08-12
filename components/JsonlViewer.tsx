"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTheme } from "@/hooks/useTheme";
import type { JsonlSummary, JsonlRecord } from "@/lib/jsonl-parser";

interface Props {
  summary: JsonlSummary;
  onExitJsonl?: () => void;
}

type FilterMode = "all" | "valid" | "invalid";

export function JsonlViewer({ summary, onExitJsonl }: Props) {
  const { theme } = useTheme();
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  const parentRef = useRef<HTMLDivElement>(null);

  // Filter & search records
  const filteredRecords = useMemo(() => {
    return summary.records.filter((r) => {
      if (filterMode === "valid" && !r.isValid) return false;
      if (filterMode === "invalid" && r.isValid) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return r.rawText.toLowerCase().includes(q) || (r.error && r.error.toLowerCase().includes(q));
      }
      return true;
    });
  }, [summary.records, filterMode, searchQuery]);

  // Virtualizer for smooth scrolling even with 100k+ records
  const rowVirtualizer = useVirtualizer({
    count: filteredRecords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  function toggleExpand(line: number) {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  }

  function handleExport(validOnly: boolean) {
    const toExport = validOnly
      ? summary.records.filter((r) => r.isValid)
      : summary.records;
    const content = toExport.map((r) => r.rawText).join("\n");
    const blob = new Blob([content], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = validOnly ? "valid_records.jsonl" : "all_records.jsonl";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="flex h-full w-full flex-col font-mono"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
    >
      {/* ── Top Bar: Summary & Actions ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 text-xs"
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
      >
        {/* Exact §31 format summary */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: theme.colors.accent }}>
            JSONL / NDJSON Mode
          </span>
          <span className="opacity-80">
            Records: <strong>{summary.totalRecords.toLocaleString()}</strong>
          </span>
          <span style={{ color: "#2ea44f" }}>
            Valid: <strong>{summary.validRecords.toLocaleString()}</strong>
          </span>
          <span style={{ color: summary.invalidRecords > 0 ? theme.colors.diffRemoved : theme.colors.muted }}>
            Invalid: <strong>{summary.invalidRecords.toLocaleString()}</strong>
          </span>
        </div>

        {/* Export & Exit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport(true)}
            className="rounded px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: theme.colors.hover,
              color: theme.colors.fg,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            Export Valid Only (.jsonl)
          </button>
          <button
            onClick={() => handleExport(false)}
            className="rounded px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: theme.colors.hover,
              color: theme.colors.fg,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            Export All
          </button>
          {onExitJsonl && (
            <button
              onClick={onExitJsonl}
              className="rounded px-2.5 py-1 text-xs transition-colors opacity-70 hover:opacity-100"
              style={{ color: theme.colors.muted }}
            >
              Exit JSONL
            </button>
          )}
        </div>
      </div>

      {/* ── Toolbar: Filters & Search ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs"
        style={{ borderColor: theme.colors.border }}
      >
        {/* Filter buttons */}
        <div className="flex items-center rounded overflow-hidden" style={{ border: `1px solid ${theme.colors.border}` }}>
          {(["all", "valid", "invalid"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className="px-3 py-1 uppercase tracking-wider text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: filterMode === mode ? `${theme.colors.accent}25` : "transparent",
                color: filterMode === mode ? theme.colors.accent : theme.colors.muted,
              }}
            >
              {mode === "all" ? `All (${summary.totalRecords})` : mode === "valid" ? `Valid (${summary.validRecords})` : `Invalid (${summary.invalidRecords})`}
            </button>
          ))}
        </div>

        {/* Search within records */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter records…"
          className="rounded px-2.5 py-1 text-xs outline-none w-48 sm:w-64"
          style={{
            backgroundColor: theme.colors.hover,
            color: theme.colors.fg,
            border: `1px solid ${theme.colors.border}`,
          }}
        />
      </div>

      {/* ── Virtualized Record List ── */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs opacity-40">No records match the current filter.</div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const record = filteredRecords[virtualRow.index];
              const isExpanded = expandedLines.has(record.lineNumber);

              return (
                <div
                  key={record.lineNumber}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    borderColor: `${theme.colors.border}40`,
                    backgroundColor: !record.isValid
                      ? "rgba(192,57,43,0.08)"
                      : virtualRow.index % 2 === 0
                      ? "rgba(255,255,255,0.015)"
                      : "transparent",
                  }}
                  className="flex flex-col border-b text-xs transition-colors"
                >
                  <div className="flex items-center gap-3 px-4 py-2">
                    {/* Line number */}
                    <span className="w-12 text-right opacity-40 shrink-0 text-[11px]">
                      L{record.lineNumber}
                    </span>

                    {/* Status badge: ✓ or ✕ */}
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold shrink-0"
                      style={{
                        backgroundColor: record.isValid ? "rgba(46,164,79,0.2)" : "rgba(192,57,43,0.2)",
                        color: record.isValid ? "#2ea44f" : theme.colors.diffRemoved,
                      }}
                    >
                      {record.isValid ? "✓" : "✕"}
                    </span>

                    {/* Record raw snippet */}
                    <span className="flex-1 truncate opacity-90 text-[11px]">
                      {record.rawText}
                    </span>

                    {/* Expand error button if invalid */}
                    {!record.isValid && (
                      <button
                        onClick={() => toggleExpand(record.lineNumber)}
                        className="rounded px-2 py-0.5 text-[10px] uppercase font-semibold transition-opacity hover:opacity-100"
                        style={{
                          backgroundColor: "rgba(192,57,43,0.2)",
                          color: theme.colors.diffRemoved,
                        }}
                      >
                        {isExpanded ? "Hide Error" : "View Error"}
                      </button>
                    )}
                  </div>

                  {/* Expanded error detail */}
                  {!record.isValid && isExpanded && (
                    <div
                      className="px-16 py-2 text-[11px] border-t"
                      style={{
                        backgroundColor: "rgba(192,57,43,0.15)",
                        borderColor: "rgba(192,57,43,0.3)",
                        color: "#ffffff",
                      }}
                    >
                      <span className="font-bold">Parse Error: </span>
                      {record.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
