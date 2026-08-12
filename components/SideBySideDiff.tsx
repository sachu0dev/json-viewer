"use client";

import type { SideBySideDiffRow } from "@/lib/json-document";
import { useTheme } from "@/hooks/useTheme";

export function SideBySideDiff({ rows }: { rows: SideBySideDiffRow[] }) {
  const { theme } = useTheme();

  if (rows.length === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center font-mono text-sm"
        style={{ color: theme.colors.muted }}
      >
        No differences — both documents are structurally identical.
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden font-mono text-xs"
      style={{ backgroundColor: theme.colors.bg }}
    >
      {/* Document A (Left Pane) */}
      <div
        className="flex-1 overflow-auto border-r"
        style={{ borderColor: theme.colors.border }}
      >
        <div
          className="sticky top-0 z-10 border-b px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: theme.colors.panel,
            borderColor: theme.colors.border,
            color: theme.colors.muted,
          }}
        >
          Document A (Original)
        </div>
        <div>
          {rows.map((row, i) => {
            const isRemoved = row.status === "removed";
            const isChanged = row.status === "changed";
            return (
              <div
                key={`left-${row.path}-${i}`}
                className="flex items-center gap-1.5 px-3 py-1 whitespace-pre"
                style={{
                  height: 26,
                  paddingLeft: row.depth * 16 + 12,
                  backgroundColor: isRemoved
                    ? `${theme.colors.diffRemoved}22`
                    : isChanged
                      ? `${theme.colors.diffChanged}22`
                      : "transparent",
                  color: isRemoved
                    ? theme.colors.diffRemoved
                    : isChanged
                      ? theme.colors.diffChanged
                      : theme.colors.fg,
                }}
              >
                {row.leftKey !== null && (
                  <span style={{ color: theme.colors.jsonKey }}>
                    {row.leftKey}:
                  </span>
                )}
                <span>{row.leftPreview ?? ""}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document B (Right Pane) */}
      <div className="flex-1 overflow-auto">
        <div
          className="sticky top-0 z-10 border-b px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: theme.colors.panel,
            borderColor: theme.colors.border,
            color: theme.colors.muted,
          }}
        >
          Document B (Compared)
        </div>
        <div>
          {rows.map((row, i) => {
            const isAdded = row.status === "added";
            const isChanged = row.status === "changed";
            return (
              <div
                key={`right-${row.path}-${i}`}
                className="flex items-center gap-1.5 px-3 py-1 whitespace-pre"
                style={{
                  height: 26,
                  paddingLeft: row.depth * 16 + 12,
                  backgroundColor: isAdded
                    ? `${theme.colors.diffAdded}22`
                    : isChanged
                      ? `${theme.colors.diffChanged}22`
                      : "transparent",
                  color: isAdded
                    ? theme.colors.diffAdded
                    : isChanged
                      ? theme.colors.diffChanged
                      : theme.colors.fg,
                }}
              >
                {row.rightKey !== null && (
                  <span style={{ color: theme.colors.jsonKey }}>
                    {row.rightKey}:
                  </span>
                )}
                <span>{row.rightPreview ?? ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
