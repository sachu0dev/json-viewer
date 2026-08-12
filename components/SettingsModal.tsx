"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { THEMES } from "@/lib/themes";
import {
  type AppSettings,
  clearAllLocalData,
  loadSettings,
  saveSettings,
} from "@/lib/settings";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  /** Called whenever a setting changes so ViewerApp can react immediately */
  onSettingsChange: (settings: AppSettings) => void;
}

type TabId = "appearance" | "formatting" | "editor" | "keyboard" | "privacy" | "performance";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "appearance", label: "Appearance", icon: "🎨" },
  { id: "formatting", label: "Formatting", icon: "{}ׅ" },
  { id: "editor", label: "Editor", icon: "📝" },
  { id: "keyboard", label: "Keyboard", icon: "⌨️" },
  { id: "privacy", label: "Privacy", icon: "🔒" },
  { id: "performance", label: "Performance", icon: "⚡" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { theme } = useTheme();
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2"
      style={{
        backgroundColor: checked ? theme.colors.accent : theme.colors.hover,
      }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm transition-transform"
        style={{
          backgroundColor: checked ? "#fff" : theme.colors.muted,
          transform: checked ? "translateX(16px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

function Select<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { theme } = useTheme();
  return (
    <select
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        // Preserve numeric type when the original value is a number
        const next = typeof value === "number" ? (Number(raw) as T) : (raw as T);
        onChange(next);
      }}
      className="cursor-pointer rounded px-2 py-1 text-sm outline-none"
      style={{
        backgroundColor: theme.colors.hover,
        color: theme.colors.fg,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)} style={{ backgroundColor: theme.colors.panel }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Shortcut rows (embedded from ShortcutsModal) ─────────────────────────────

const SHORTCUT_GROUPS = [
  {
    category: "General",
    items: [
      { key: "⌘K / Ctrl+K", description: "Open command palette" },
      { key: "Escape", description: "Close palette / clear search" },
      { key: "?", description: "Open this shortcuts cheat sheet" },
    ],
  },
  {
    category: "Editing & Formatting",
    items: [
      { key: "⌘⇧F / Ctrl+Shift+F", description: "Format JSON" },
      { key: "⌘⇧M / Ctrl+Shift+M", description: "Minify JSON (shows stats)" },
      { key: "⌘G / Ctrl+G", description: "Jump to line" },
      { key: "⌘Z / Ctrl+Z", description: "Undo" },
      { key: "⌘⇧Z / Ctrl+Shift+Z", description: "Redo" },
    ],
  },
  {
    category: "Search",
    items: [
      { key: "/ or ⌘F", description: "Focus search bar" },
      { key: "Enter / ↓", description: "Next match" },
      { key: "⇧Enter / ↑", description: "Previous match" },
    ],
  },
  {
    category: "Navigation",
    items: [
      { key: "⌘D / Ctrl+D", description: "Compare / diff mode" },
      { key: "⌘S / Ctrl+S", description: "Download JSON" },
      { key: "⌘O / Ctrl+O", description: "Open file" },
    ],
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsModal({ onClose, onSettingsChange }: Props) {
  const { theme, setThemeId } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("appearance");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [clearMsg, setClearMsg] = useState("");

  // Focus trap
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusables = el.querySelectorAll<HTMLElement>(
      "button, select, [role=switch], [tabindex='0']",
    );
    focusables[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const list = Array.from(focusables);
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function updateAndNotify(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    onSettingsChange(next);
  }

  const sep = { borderBottom: `1px solid ${theme.colors.border}` };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="flex h-135 w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl"
        style={{
          backgroundColor: theme.colors.bg,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* Sidebar tabs */}
        <nav
          className="flex w-40 shrink-0 flex-col gap-0.5 overflow-y-auto p-2"
          style={{ borderRight: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.panel }}
        >
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: theme.colors.muted }}>
            Settings
          </p>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors"
              style={{
                backgroundColor: activeTab === t.id ? theme.colors.hover : "transparent",
                color: activeTab === t.id ? theme.colors.fg : theme.colors.muted,
                fontWeight: activeTab === t.id ? 600 : 400,
              }}
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ ...sep, color: theme.colors.fg }}
          >
            <h2 className="text-sm font-semibold">{TABS.find((t) => t.id === activeTab)?.label}</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          {/* Tab body */}
          <div
            className="flex-1 overflow-y-auto px-5 py-2"
            style={{ color: theme.colors.fg }}
          >
            {activeTab === "appearance" && (
              <div>
                <Row label="Theme">
                  <Select
                    value={theme.id}
                    options={THEMES.map((t: { id: string; name: string }) => ({ value: t.id, label: t.name }))}
                    onChange={(v) => {
                      setThemeId(v);
                      updateAndNotify({ themeId: v });
                    }}
                  />
                </Row>
                <div style={sep} />
                <p className="mt-3 text-xs" style={{ color: theme.colors.muted }}>
                  Your theme preference is saved locally and applied on every visit.
                </p>
              </div>
            )}

            {activeTab === "formatting" && (
              <div>
                <Row label="Indent size">
                  <Select
                    value={settings.formatIndent}
                    options={[
                      { value: 2 as const, label: "2 spaces" },
                      { value: 4 as const, label: "4 spaces" },
                      { value: "tab" as const, label: "Tabs" },
                    ]}
                    onChange={(v) => updateAndNotify({ formatIndent: v as AppSettings["formatIndent"] })}
                  />
                </Row>
                <div style={sep} />
                <Row label="Sort keys alphabetically">
                  <Toggle
                    checked={settings.formatSortKeys}
                    onChange={(v) => updateAndNotify({ formatSortKeys: v })}
                  />
                </Row>
                <div style={sep} />
                <Row label="Trailing newline">
                  <Toggle
                    checked={settings.formatTrailingNewline}
                    onChange={(v) => updateAndNotify({ formatTrailingNewline: v })}
                  />
                </Row>
                <div style={sep} />
                <p className="mt-3 text-xs" style={{ color: theme.colors.muted }}>
                  These options are also accessible from the Format ▾ button in the toolbar.
                </p>
              </div>
            )}

            {activeTab === "editor" && (
              <div>
                <Row label="Font size">
                  <Select
                    value={settings.editorFontSize}
                    options={[
                      { value: 12 as const, label: "12px" },
                      { value: 13 as const, label: "13px (default)" },
                      { value: 14 as const, label: "14px" },
                      { value: 16 as const, label: "16px" },
                    ]}
                    onChange={(v) => updateAndNotify({ editorFontSize: v as AppSettings["editorFontSize"] })}
                  />
                </Row>
                <div style={sep} />
                <Row label="Word wrap">
                  <Toggle
                    checked={settings.editorWordWrap}
                    onChange={(v) => updateAndNotify({ editorWordWrap: v })}
                  />
                </Row>
                <div style={sep} />
                <Row label="Line height">
                  <Select
                    value={settings.editorLineHeight}
                    options={[
                      { value: 1.4 as const, label: "Compact (1.4)" },
                      { value: 1.6 as const, label: "Normal (1.6)" },
                      { value: 1.8 as const, label: "Relaxed (1.8)" },
                    ]}
                    onChange={(v) => updateAndNotify({ editorLineHeight: v as AppSettings["editorLineHeight"] })}
                  />
                </Row>
              </div>
            )}

            {activeTab === "keyboard" && (
              <div className="space-y-4">
                {SHORTCUT_GROUPS.map((g) => (
                  <div key={g.category}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.muted }}>
                      {g.category}
                    </p>
                    <div className="overflow-hidden rounded" style={{ border: `1px solid ${theme.colors.border}` }}>
                      {g.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 text-xs"
                          style={{
                            borderTop: i > 0 ? `1px solid ${theme.colors.border}` : "none",
                            color: theme.colors.fg,
                          }}
                        >
                          <span style={{ color: theme.colors.muted }}>{item.description}</span>
                          <kbd
                            className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
                          >
                            {item.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "privacy" && (
              <div>
                <div
                  className="mb-4 rounded-lg p-3 text-sm"
                  style={{ backgroundColor: `${theme.colors.accent}15`, border: `1px solid ${theme.colors.accent}40` }}
                >
                  <p className="font-semibold" style={{ color: theme.colors.accent }}>🔒 Processing locally</p>
                  <p className="mt-1 text-xs" style={{ color: theme.colors.fg }}>
                    Everything you paste, upload, or type stays entirely in your browser. No JSON content, file names, JWT
                    payloads, or search queries are ever sent to a server or third party.
                  </p>
                </div>

                <Row label="Save recent files locally">
                  <Toggle
                    checked={settings.historyEnabled}
                    onChange={(v) => updateAndNotify({ historyEnabled: v })}
                  />
                </Row>
                <div style={sep} />

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      clearAllLocalData();
                      setClearMsg("All local data cleared.");
                      setTimeout(() => setClearMsg(""), 3000);
                    }}
                    className="rounded px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: "#c0392b",
                      color: "#fff",
                    }}
                  >
                    Clear local data
                  </button>
                  {clearMsg && (
                    <span className="text-xs" style={{ color: theme.colors.muted }}>
                      {clearMsg}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs" style={{ color: theme.colors.muted }}>
                  Removes all devure-json:* localStorage entries — theme, settings, recent files, and format preferences.
                </p>
              </div>
            )}

            {activeTab === "performance" && (
              <div>
                <Row label="Use background worker">
                  <Toggle
                    checked={settings.workerEnabled}
                    onChange={(v) => updateAndNotify({ workerEnabled: v })}
                  />
                </Row>
                <p className="mt-1 text-xs" style={{ color: theme.colors.muted }}>
                  The background worker keeps the UI responsive during heavy operations (parsing, diff, search). Disable only if you
                  encounter compatibility issues.
                </p>
                <div style={sep} className="mt-2" />
                <p className="mt-3 text-xs" style={{ color: theme.colors.muted }}>
                  All heavy operations (format, minify, diff, search) run off the main thread via Web Worker so the UI
                  stays interactive during processing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
