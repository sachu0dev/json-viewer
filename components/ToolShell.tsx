"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";
import { CommandPalette, type Command } from "./CommandPalette";
import { ShortcutsModal } from "./ShortcutsModal";
import { SettingsModal } from "./SettingsModal";

const NAV_LINKS: { href: string; label: string; icon: string }[] = [
  { href: "/jsonpath", label: "JSONPath", icon: "🔍" },
  { href: "/json-schema-validator", label: "Schema", icon: "🧬" },
  { href: "/jwt-decoder", label: "JWT", icon: "🔑" },
  { href: "/api-response", label: "API", icon: "📡" },
  { href: "/json-diff", label: "Diff", icon: "🔀" },
  { href: "/jsonl-viewer", label: "JSONL", icon: "📜" },
  { href: "/large-files", label: "Large files", icon: "🗂️" },
];

/**
 * Shared chrome for the satellite tool pages (JSONPath, Schema, JWT, API,
 * converters) — one header, one nav, one command palette, one shortcuts
 * sheet, instead of each page hand-rolling its own. The main viewer at `/`
 * keeps its own richer toolbar (format/share/compare are specific to it);
 * this is for the single-purpose tool pages that only need "go elsewhere"
 * and "search commands", not a full editing toolbar.
 */
export function ToolShell({
  title,
  activeHref,
  presetSlot,
  commands = [],
  onSelectCommand,
  children,
}: {
  title: string;
  activeHref: string;
  presetSlot?: ReactNode;
  commands?: Command[];
  onSelectCommand?: (id: string) => void;
  children: ReactNode;
}) {
  const { theme, setThemeId, themes } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const inInput = document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT";

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        setSettingsOpen((open) => !open);
        return;
      }
      if (e.key === "?" && !inInput) {
        e.preventDefault();
        setShortcutsOpen((open) => !open);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setShortcutsOpen(false);
        setSettingsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navCommands: Command[] = NAV_LINKS.filter((l) => l.href !== activeHref).map((l) => ({
    id: `nav-${l.href}`,
    label: `Go to ${l.label}`,
  }));
  const themeCommands: Command[] = themes.map((t) => ({ id: `theme-${t.id}`, label: `Theme: ${t.name}` }));
  const allCommands: Command[] = [
    ...commands,
    ...navCommands,
    { id: "shortcuts-sheet", label: "Keyboard shortcuts…" },
    { id: "open-settings", label: "Open settings…", shortcut: "⌘," },
    ...themeCommands,
  ];

  function handleSelectCommand(id: string) {
    if (id.startsWith("nav-")) {
      window.location.href = id.slice(4);
      return;
    }
    if (id.startsWith("theme-")) {
      setThemeId(id.slice(6));
      return;
    }
    if (id === "shortcuts-sheet") {
      setShortcutsOpen(true);
      return;
    }
    if (id === "open-settings") {
      setSettingsOpen(true);
      return;
    }
    onSelectCommand?.(id);
  }

  return (
    <div
      className="flex h-dvh w-full flex-col font-sans transition-colors duration-150"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 shrink-0"
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-xs font-bold tracking-wider uppercase hover:opacity-80"
            style={{ color: theme.colors.accent }}
          >
            JSON VIEWER
          </Link>
          <span className="text-xs opacity-40">/</span>
          <h1 className="font-mono text-xs font-semibold m-0" style={{ color: theme.colors.fg }}>
            {title}
          </h1>
          {presetSlot}
        </div>

        <nav className="flex flex-wrap items-center gap-3 font-mono text-xs" style={{ color: theme.colors.muted }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:opacity-80 hover:underline"
              style={link.href === activeHref ? { color: theme.colors.accent, fontWeight: 700 } : undefined}
              aria-current={link.href === activeHref ? "page" : undefined}
            >
              <span aria-hidden="true">{link.icon}</span> {link.label}
            </Link>
          ))}

          <button
            onClick={() => setPaletteOpen(true)}
            className="rounded px-2 py-0.5 font-mono text-xs font-semibold transition-colors hover:opacity-80"
            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
            title="Command palette (⌘K)"
          >
            ⌘K
          </button>

          <button
            onClick={() => setShortcutsOpen(true)}
            className="rounded px-2 py-0.5 font-mono text-xs font-semibold transition-colors hover:opacity-80"
            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            ?
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded px-2 py-0.5 text-sm transition-colors hover:opacity-80"
            style={{ color: theme.colors.muted }}
            title="Settings (⌘,)"
            aria-label="Open settings"
          >
            ⚙️
          </button>

          <select
            value={theme.id}
            onChange={(e) => setThemeId(e.target.value)}
            className="cursor-pointer bg-transparent px-2 py-0.5 text-xs outline-none transition-colors border rounded"
            style={{ borderColor: theme.colors.border, color: theme.colors.muted }}
            aria-label="Select theme"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id} style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                🎨 {t.name}
              </option>
            ))}
          </select>

          <Link
            href="/privacy"
            className="hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors hover:opacity-80 md:flex"
            style={{ borderColor: theme.colors.border, color: theme.colors.muted }}
            title="Processed entirely in your browser — see how"
          >
            🔒 Local-only
          </Link>

          <Link href="/" className="hover:opacity-80 hover:underline">
            ← Back to viewer
          </Link>
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

      {paletteOpen && (
        <CommandPalette
          commands={allCommands}
          onSelectCommand={handleSelectCommand}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSettingsChange={(s) => {
            if (s.themeId !== theme.id) setThemeId(s.themeId);
          }}
        />
      )}
    </div>
  );
}
