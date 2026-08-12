"use client";

import type { RecentFile } from "@/lib/recent-files";
import { useTheme } from "@/hooks/useTheme";

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(savedAt: number): string {
  const minutes = Math.round((savedAt - Date.now()) / 60_000);
  if (minutes > -1) return "just now";
  if (minutes > -60) return relativeTime.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relativeTime.format(hours, "hour");
  return relativeTime.format(Math.round(hours / 24), "day");
}

export function EmptyState({
  recent,
  onSelect,
  onClear,
}: {
  recent: RecentFile[];
  onSelect: (text: string) => void;
  onClear: () => void;
}) {
  const { theme } = useTheme();

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 text-center"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.muted }}
    >
      <p className="text-lg font-medium" style={{ color: theme.colors.fg }}>
        Paste JSON (⌘V) or drop a file to inspect it
      </p>
      <p className="text-sm" style={{ color: theme.colors.muted }}>
        Nothing you paste or drop ever leaves your browser.
      </p>

      {recent.length > 0 && (
        <div className="mt-6 w-full max-w-sm text-left">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: theme.colors.muted }}>
              Recent
            </span>
            <button
              onClick={onClear}
              className="text-xs transition-colors hover:underline"
              style={{ color: theme.colors.muted }}
            >
              Clear
            </button>
          </div>
          <ul
            className="overflow-hidden rounded-lg"
            style={{
              borderColor: theme.colors.border,
              borderWidth: "1px",
              borderStyle: "solid",
              backgroundColor: theme.colors.panel,
            }}
          >
            {recent.map((file, i) => (
              <li
                key={file.id}
                style={{
                  borderTopWidth: i > 0 ? "1px" : "0px",
                  borderTopStyle: "solid",
                  borderTopColor: theme.colors.border,
                }}
              >
                <button
                  onClick={() => onSelect(file.text)}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left font-mono text-xs transition-colors"
                  style={{ color: theme.colors.fg }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span className="truncate" style={{ color: theme.colors.fg }}>
                    {file.name}
                  </span>
                  <span className="ml-2 shrink-0" style={{ color: theme.colors.muted }}>
                    {timeAgo(file.savedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
