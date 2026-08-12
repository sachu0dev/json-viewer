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

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Groups recent files into Today / Yesterday / Older sections, each already sorted newest-first. */
function groupByRecency(recent: RecentFile[]): { label: string; files: RecentFile[] }[] {
  const today = startOfDay(new Date());
  const yesterday = today - 24 * 60 * 60 * 1000;

  const groups = { Today: [] as RecentFile[], Yesterday: [] as RecentFile[], Older: [] as RecentFile[] };
  for (const file of recent) {
    const day = startOfDay(new Date(file.savedAt));
    if (day >= today) groups.Today.push(file);
    else if (day >= yesterday) groups.Yesterday.push(file);
    else groups.Older.push(file);
  }
  return (["Today", "Yesterday", "Older"] as const)
    .map((label) => ({ label, files: groups[label] }))
    .filter((g) => g.files.length > 0);
}

export function EmptyState({
  recent,
  onSelect,
  onClear,
  onRemoveOne,
}: {
  recent: RecentFile[];
  onSelect: (text: string) => void;
  onClear: () => void;
  onRemoveOne: (id: string) => void;
}) {
  const { theme } = useTheme();
  const groups = groupByRecency(recent);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 text-center overflow-y-auto py-8"
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
              Clear all
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
              <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider opacity-60" style={{ color: theme.colors.muted }}>
                {group.label}
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
                {group.files.map((file, i) => (
                  <li
                    key={file.id}
                    className="group/row flex items-center"
                    style={{
                      borderTopWidth: i > 0 ? "1px" : "0px",
                      borderTopStyle: "solid",
                      borderTopColor: theme.colors.border,
                    }}
                  >
                    <button
                      onClick={() => onSelect(file.text)}
                      className="flex flex-1 min-w-0 items-center justify-between px-3.5 py-2.5 text-left font-mono text-xs transition-colors"
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
                    <button
                      onClick={() => onRemoveOne(file.id)}
                      className="shrink-0 px-2.5 py-2.5 text-xs opacity-0 transition-opacity hover:!opacity-100 group-hover/row:opacity-40"
                      style={{ color: theme.colors.muted }}
                      aria-label={`Remove ${file.name} from recent files`}
                      title="Remove from recent files"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
