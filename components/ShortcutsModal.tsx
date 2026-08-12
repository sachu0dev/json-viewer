"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";

interface ShortcutGroup {
  category: string;
  items: { key: string; description: string }[];
}

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl";
  const alt = isMac ? "⌥" : "Alt";
  const shift = isMac ? "⇧" : "Shift";

  const groups: ShortcutGroup[] = [
    {
      category: "General & Palette",
      items: [
        { key: `${mod}K`, description: "Open Command Palette" },
        { key: "?", description: "Toggle Keyboard Shortcuts cheat sheet" },
        { key: `${mod}O`, description: "Open JSON file from disk" },
        { key: `${mod}S`, description: "Download formatted JSON" },
        { key: "Esc", description: "Clear search / Exit compare / Close dialog" },
      ],
    },
    {
      category: "Editing & Formatting",
      items: [
        { key: `${mod}${shift}F`, description: "Format JSON using saved options" },
        { key: `${mod}${shift}M`, description: "Minify JSON (shows stats, copy & download)" },
        { key: `${mod}G`, description: "Jump to line number in editor" },
        { key: `${mod}Z`, description: "Undo edit" },
        { key: `${mod}${shift}Z`, description: "Redo edit" },
      ],
    },
    {
      category: "Search & Replace",
      items: [
        { key: `/ or ${mod}F`, description: "Focus search bar" },
        { key: `${mod}${alt}F`, description: "Toggle Find & Replace row" },
        { key: "Enter / ↓", description: "Jump to next match" },
        { key: "Shift+Enter / ↑", description: "Jump to previous match" },
      ],
    },
    {
      category: "Tree Navigation & Workflows",
      items: [
        { key: "↑ / ↓", description: "Move focus between tree nodes" },
        { key: "Enter / Space", description: "Expand or collapse focused container node" },
        { key: "y", description: "Copy JSONPath of focused node ($.foo.bar)" },
        { key: "Right Click", description: "Open context menu (Copy JSONPath, dot path, value)" },
      ],
    },
    {
      category: "Diff & View Layouts",
      items: [
        { key: `${mod}D`, description: "Compare side-by-side with second JSON" },
        { key: "Split / Tree / Preview", description: "Switch view layout modes in header" },
      ],
    },
  ];

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        ref={modalRef}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl transition-all"
        style={{
          backgroundColor: theme.colors.panel,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.fg,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${theme.colors.border}` }}
        >
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
              Keyboard Shortcuts Cheat Sheet
            </h2>
            <p className="font-mono text-xs opacity-60" style={{ color: theme.colors.muted }}>
              Master these shortcuts to work blazingly fast in JSON Viewer
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 font-mono text-sm opacity-60 transition-opacity hover:opacity-100"
            style={{ color: theme.colors.muted }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <h3
                className="font-mono text-[11px] font-bold uppercase tracking-widest"
                style={{ color: theme.colors.accent }}
              >
                {group.category}
              </h3>
              <div
                className="grid grid-cols-1 gap-2 rounded-lg p-3 sm:grid-cols-2"
                style={{
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 py-1">
                    <span className="font-mono text-xs opacity-80">{item.description}</span>
                    <kbd
                      className="shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-semibold"
                      style={{
                        backgroundColor: theme.colors.hover,
                        color: theme.colors.fg,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-3 font-mono text-xs opacity-60"
          style={{ borderTop: `1px solid ${theme.colors.border}`, color: theme.colors.muted }}
        >
          <span>Press <kbd className="rounded px-1 bg-neutral-800 text-neutral-200">?</kbd> anytime to toggle this sheet</span>
          <button
            onClick={onClose}
            className="rounded px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
