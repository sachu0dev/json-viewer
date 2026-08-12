"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
}

export function CommandPalette({
  onClose,
  onSelectCommand,
  commands,
}: {
  onClose: () => void;
  onSelectCommand: (id: string) => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  function runActive() {
    const command = filtered[activeIndex];
    if (command) {
      onSelectCommand(command.id);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-32 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl shadow-2xl transition-all"
        style={{
          backgroundColor: theme.colors.panel,
          borderColor: theme.colors.border,
          borderWidth: "1px",
          borderStyle: "solid",
          color: theme.colors.fg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center px-4 py-3"
          style={{
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: theme.colors.border,
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runActive();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Type a command or theme name…"
            className="w-full bg-transparent font-mono text-sm outline-none"
            style={{ color: theme.colors.fg }}
          />
        </div>
        <ul className="max-h-72 overflow-auto py-1">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm" style={{ color: theme.colors.muted }}>
              No matching commands
            </li>
          )}
          {filtered.map((command, i) => {
            const isSelected = i === activeIndex;
            return (
              <li key={command.id}>
                <button
                  onClick={() => {
                    onSelectCommand(command.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-sm transition-colors"
                  style={{
                    backgroundColor: isSelected ? theme.colors.active : "transparent",
                    color: theme.colors.fg,
                  }}
                >
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <kbd
                      className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] opacity-60"
                      style={{
                        backgroundColor: theme.colors.hover,
                        color: theme.colors.muted,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
