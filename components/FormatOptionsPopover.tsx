"use client";

import { useEffect, useRef } from "react";
import type { FormatOptions } from "@/lib/json-document";
import { useTheme } from "@/hooks/useTheme";

const STORAGE_KEY = "devure-json:format-options";

export function loadFormatOptions(): FormatOptions {
  if (typeof window === "undefined") return { indent: 2, sortKeys: false, trailingNewline: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FormatOptions>;
      return {
        indent: parsed.indent ?? 2,
        sortKeys: parsed.sortKeys ?? false,
        trailingNewline: parsed.trailingNewline ?? false,
      };
    }
  } catch { /* ignore */ }
  return { indent: 2, sortKeys: false, trailingNewline: false };
}

export function saveFormatOptions(opts: FormatOptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
  } catch { /* ignore */ }
}

const INDENT_OPTIONS: { value: FormatOptions["indent"]; label: string }[] = [
  { value: 2, label: "2 spaces" },
  { value: 4, label: "4 spaces" },
  { value: "tab", label: "Tab" },
];

export function FormatOptionsPopover({
  options,
  onChange,
  onClose,
}: {
  options: FormatOptions;
  onChange: (opts: FormatOptions) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  function update(patch: Partial<FormatOptions>) {
    const next = { ...options, ...patch };
    onChange(next);
    saveFormatOptions(next);
  }

  const rowStyle = "flex items-center justify-between gap-4 py-1.5";
  const labelStyle = { color: theme.colors.muted, fontSize: "12px", fontFamily: "monospace" } as const;

  return (
    <div
      ref={ref}
      className="absolute z-40 mt-1 rounded-lg shadow-2xl overflow-hidden"
      style={{
        backgroundColor: theme.colors.panel,
        border: `1px solid ${theme.colors.border}`,
        minWidth: "220px",
        top: "100%",
        left: "0",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider"
        style={{
          color: theme.colors.muted,
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        Format Options
      </div>

      <div className="px-3 py-2 flex flex-col gap-0.5">
        <p className="font-mono text-[11px] uppercase tracking-wider mb-1" style={{ color: theme.colors.muted }}>
          Indent
        </p>
        <div className="flex gap-1.5 mb-2">
          {INDENT_OPTIONS.map((opt) => {
            const active = options.indent === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => update({ indent: opt.value })}
                className="flex-1 rounded px-2 py-1 font-mono text-[11px] transition-colors"
                style={{
                  backgroundColor: active ? theme.colors.accent : theme.colors.hover,
                  color: active ? "#fff" : theme.colors.fg,
                  border: `1px solid ${active ? theme.colors.accent : theme.colors.border}`,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className={rowStyle}>
          <span style={labelStyle}>Sort keys A–Z</span>
          <button
            role="switch"
            aria-checked={options.sortKeys}
            onClick={() => update({ sortKeys: !options.sortKeys })}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              backgroundColor: options.sortKeys ? theme.colors.accent : theme.colors.hover,
              border: `1px solid ${options.sortKeys ? theme.colors.accent : theme.colors.border}`,
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                backgroundColor: "#fff",
                transform: options.sortKeys ? "translateX(16px)" : "translateX(0)",
              }}
            />
          </button>
        </div>

        <div className={rowStyle}>
          <span style={labelStyle}>Trailing newline</span>
          <button
            role="switch"
            aria-checked={options.trailingNewline}
            onClick={() => update({ trailingNewline: !options.trailingNewline })}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              backgroundColor: options.trailingNewline ? theme.colors.accent : theme.colors.hover,
              border: `1px solid ${options.trailingNewline ? theme.colors.accent : theme.colors.border}`,
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                backgroundColor: "#fff",
                transform: options.trailingNewline ? "translateX(16px)" : "translateX(0)",
              }}
            />
          </button>
        </div>
      </div>

      <div
        className="px-3 py-1.5 font-mono text-[10px] opacity-60"
        style={{ borderTop: `1px solid ${theme.colors.border}`, color: theme.colors.muted }}
      >
        Settings saved automatically
      </div>
    </div>
  );
}
