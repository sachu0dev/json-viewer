"use client";

import type { DiffEntry } from "@/lib/json-document";
import { useTheme } from "@/hooks/useTheme";

const STATUS_MARK: Record<DiffEntry["status"], string> = {
  added: "+",
  removed: "-",
  changed: "~",
};

export function DiffView({ entries }: { entries: DiffEntry[] }) {
  const { theme } = useTheme();

  function getStatusColor(status: DiffEntry["status"]): string {
    switch (status) {
      case "added":
        return theme.colors.diffAdded;
      case "removed":
        return theme.colors.diffRemoved;
      case "changed":
        return theme.colors.diffChanged;
    }
  }

  if (entries.length === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center font-mono text-sm"
        style={{ color: theme.colors.muted }}
      >
        No differences — the two documents are structurally identical.
      </div>
    );
  }

  return (
    <div
      className="h-full w-full overflow-auto font-mono text-sm"
      style={{ backgroundColor: theme.colors.bg }}
    >
      {entries.map((entry) => (
        <div
          key={entry.path}
          className="flex items-start gap-2 px-3 py-1.5"
          style={{
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: theme.colors.border,
          }}
        >
          <span
            className="w-4 shrink-0 font-bold"
            style={{ color: getStatusColor(entry.status) }}
          >
            {STATUS_MARK[entry.status]}
          </span>
          <span className="shrink-0" style={{ color: theme.colors.muted }}>
            {entry.path}
          </span>
          {entry.before !== undefined && (
            <span
              className="line-through"
              style={{ color: theme.colors.diffRemoved }}
            >
              {entry.before}
            </span>
          )}
          {entry.after !== undefined && (
            <span style={{ color: theme.colors.diffAdded }}>{entry.after}</span>
          )}
        </div>
      ))}
    </div>
  );
}
