"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTheme } from "@/hooks/useTheme";
import type { Row } from "@/lib/json-document";

const ROW_HEIGHT = 28;

function renderHighlightedText(
  text: string,
  query: string | undefined,
  defaultColor: string,
  accentColor: string
): ReactNode {
  if (!query || !query.trim()) {
    return <span style={{ color: defaultColor }}>{text}</span>;
  }

  const needle = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const foundIdx = lowerText.indexOf(needle);

  if (foundIdx === -1) {
    return <span style={{ color: defaultColor }}>{text}</span>;
  }

  const parts: ReactNode[] = [];
  let pos = 0;
  let keyIdx = 0;

  while (pos < text.length) {
    const idx = lowerText.indexOf(needle, pos);
    if (idx === -1) {
      parts.push(
        <span key={keyIdx++} style={{ color: defaultColor }}>
          {text.slice(pos)}
        </span>
      );
      break;
    }

    if (idx > pos) {
      parts.push(
        <span key={keyIdx++} style={{ color: defaultColor }}>
          {text.slice(pos, idx)}
        </span>
      );
    }

    const matchedText = text.slice(idx, idx + needle.length);
    parts.push(
      <mark
        key={keyIdx++}
        className="rounded px-0.5 font-bold"
        style={{
          backgroundColor: accentColor,
          color: "#000000",
        }}
      >
        {matchedText}
      </mark>
    );

    pos = idx + needle.length;
  }

  return <>{parts}</>;
}

/** Convert internal worker path format (e.g. $.foo.bar[0]) to a dot-notation path */
function toDotPath(path: string): string {
  return path
    .replace(/^\$\.?/, "")              // strip leading $. or $
    .replace(/\[(\d+)\]/g, ".$1");     // [0] -> .0
}

interface ContextMenuState {
  x: number;
  y: number;
  row: Row;
}

export function JsonTree({
  rows,
  onToggle,
  revealTarget,
  searchQuery,
  onToast,
}: {
  rows: Row[];
  onToggle: (path: string) => void;
  revealTarget?: string | null;
  searchQuery?: string;
  onToast?: (msg: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  useEffect(() => {
    if (!revealTarget) return;
    const index = rows.findIndex((row) => row.path === revealTarget);
    if (index === -1) return;
    setFocusedIndex(index);
    virtualizer.scrollToIndex(index, { align: "center" });

    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return;
    }
    parentRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealTarget, rows]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [contextMenu]);

  function moveFocus(next: number) {
    const clamped = Math.max(0, Math.min(rows.length - 1, next));
    setFocusedIndex(clamped);
    virtualizer.scrollToIndex(clamped);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(focusedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(focusedIndex - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      const row = rows[focusedIndex];
      if (row?.hasChildren) {
        e.preventDefault();
        onToggle(row.path);
      }
    } else if (e.key === "y") {
      const row = rows[focusedIndex];
      if (row) {
        navigator.clipboard.writeText(row.path);
        onToast?.(`Copied path: ${row.path}`);
      }
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      onToast?.(label);
    });
    setContextMenu(null);
  }

  function getValueColor(type: Row["type"]): string {
    switch (type) {
      case "string":
        return theme.colors.jsonString;
      case "number":
        return theme.colors.jsonNumber;
      case "boolean":
        return theme.colors.jsonBoolean;
      case "null":
        return theme.colors.jsonNull;
      case "object":
      case "array":
      default:
        return theme.colors.jsonPunctuation;
    }
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div
        ref={parentRef}
        className="h-full w-full overflow-auto font-mono text-sm outline-none"
        style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
        role="tree"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isFocused = virtualRow.index === focusedIndex;
            const isMatch = Boolean(revealTarget && row.path === revealTarget);

            return (
              <div
                key={row.path}
                role="treeitem"
                aria-expanded={row.hasChildren ? row.isExpanded : undefined}
                aria-selected={isFocused}
                title={row.path}
                className="absolute left-0 top-0 flex w-full cursor-pointer items-center gap-1.5 px-2 whitespace-pre transition-all duration-75"
                style={{
                  height: ROW_HEIGHT,
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingLeft: row.depth * 16 + 8,
                  backgroundColor: isMatch
                    ? `${theme.colors.accent}35`
                    : isFocused
                      ? theme.colors.active
                      : "transparent",
                  borderLeftWidth: isMatch ? "3px" : "0px",
                  borderLeftStyle: "solid",
                  borderLeftColor: isMatch ? theme.colors.accent : "transparent",
                }}
                onClick={() => {
                  setFocusedIndex(virtualRow.index);
                  if (row.hasChildren) onToggle(row.path);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, row });
                }}
              >
                <span className="w-4 shrink-0" style={{ color: theme.colors.muted }}>
                  {row.hasChildren ? (row.isExpanded ? "▾" : "▸") : ""}
                </span>
                {row.key !== null && (
                  <span>
                    {renderHighlightedText(
                      typeof row.key === "number" ? String(row.key) : row.key,
                      searchQuery,
                      theme.colors.jsonKey,
                      theme.colors.accent
                    )}
                    <span style={{ color: theme.colors.jsonKey }}>:</span>
                  </span>
                )}
                <span>
                  {renderHighlightedText(
                    row.preview,
                    searchQuery,
                    getValueColor(row.type),
                    theme.colors.accent
                  )}
                </span>

                {isMatch && (
                  <span
                    className="ml-auto shrink-0 rounded px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: theme.colors.accent,
                      color: theme.colors.bg,
                    }}
                  >
                    Match
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg shadow-2xl"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: theme.colors.panel,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest truncate"
            style={{ color: theme.colors.muted, borderBottom: `1px solid ${theme.colors.border}` }}
          >
            {contextMenu.row.path.length > 30
              ? "…" + contextMenu.row.path.slice(-28)
              : contextMenu.row.path}
          </div>
          {[
            { label: "Copy JSONPath", value: contextMenu.row.path, toast: `Copied: ${contextMenu.row.path}` },
            { label: "Copy dot path", value: toDotPath(contextMenu.row.path), toast: `Copied dot path` },
            { label: "Copy value", value: contextMenu.row.preview, toast: "Copied value" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs transition-colors"
              style={{ color: theme.colors.fg, backgroundColor: "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.colors.hover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
              onClick={() => copyToClipboard(item.value, item.toast)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
