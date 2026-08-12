"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { THEMES } from "@/lib/themes";
import { CONVERTERS, CONVERTER_SLUGS, executeConverter } from "@/lib/converters/registry";
import { tokenizeCode } from "@/lib/code-highlighter";
import { SettingsModal } from "@/components/SettingsModal";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { CommandPalette } from "@/components/CommandPalette";

interface Props {
  slug: string;
  initialHashText?: string;
}

export function ConverterPlayground({ slug, initialHashText }: Props) {
  const router = useRouter();
  const { theme, setThemeId } = useTheme();
  const [, startTransition] = useTransition();

  const config = CONVERTERS[slug] || CONVERTERS["json-to-typescript"];

  // State
  const [jsonText, setJsonText] = useState(() => initialHashText || config.sampleJson);
  const [outputCode, setOutputCode] = useState("");
  const [options, setOptions] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const opt of config.options) {
      initial[opt.id] = opt.default;
    }
    return initial;
  });
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync options when slug changes
  const [prevSlug, setPrevSlug] = useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    const initial: Record<string, unknown> = {};
    for (const opt of config.options) {
      initial[opt.id] = opt.default;
    }
    setOptions(initial);
  }

  // Live conversion effect
  useEffect(() => {
    let active = true;
    executeConverter(slug, jsonText, options).then((result) => {
      if (active) setOutputCode(result);
    });
    return () => {
      active = false;
    };
  }, [slug, jsonText, options]);

  function handleOptionChange(key: string, value: unknown) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  function handleCopy() {
    navigator.clipboard.writeText(outputCode).then(() => {
      showToast("Copied code to clipboard");
    });
  }

  function handleDownload() {
    const blob = new Blob([outputCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output_${config.targetName.toLowerCase()}${config.fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded output${config.fileExtension}`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const commands = [
    { id: "open-editor", label: "← Back to JSON Editor" },
    ...CONVERTER_SLUGS.map((s) => ({
      id: `nav-${s}`,
      label: `Switch target: ${CONVERTERS[s].targetName}`,
    })),
    { id: "shortcuts", label: "Keyboard shortcuts cheat sheet" },
    { id: "settings", label: "Open Settings" },
  ];

  function handleSelectCommand(id: string) {
    if (id === "open-editor") {
      router.push("/");
    } else if (id === "shortcuts") {
      setShortcutsOpen(true);
    } else if (id === "settings") {
      setSettingsOpen(true);
    } else if (id.startsWith("nav-")) {
      const target = id.slice(4);
      router.push(`/${target}`);
    }
  }

  const tokenizedLines = tokenizeCode(outputCode);

  function getTokenColor(tokenType: string) {
    switch (tokenType) {
      case "keyword": return theme.colors.accent;
      case "type": return theme.colors.jsonKey;
      case "string": return theme.colors.jsonString;
      case "number": return theme.colors.jsonNumber;
      case "boolean": return theme.colors.jsonBoolean;
      case "comment": return theme.colors.muted;
      case "annotation": return theme.colors.jsonPunctuation;
      case "punct": return theme.colors.jsonPunctuation;
      default: return theme.colors.fg;
    }
  }

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden font-mono text-sm"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
    >
      {/* ── Top Bar ── */}
      <header
        className="flex h-12 shrink-0 items-center justify-between border-b px-4 transition-colors"
        style={{
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.panel,
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-xs font-bold tracking-wider uppercase transition-opacity hover:opacity-80"
            style={{ color: theme.colors.accent }}
          >
            JSON Viewer
          </Link>
          <span className="text-xs opacity-30">/</span>

          {/* Target Language Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: theme.colors.fg }}>
              JSON →
            </span>
            <select
              value={slug}
              onChange={(e) => {
                const targetSlug = e.target.value;
                startTransition(() => {
                  router.push(`/${targetSlug}`);
                });
              }}
              className="rounded border px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
              style={{
                backgroundColor: theme.colors.bg,
                color: theme.colors.accent,
                borderColor: theme.colors.border,
              }}
            >
              {CONVERTER_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {CONVERTERS[s].targetName} ({CONVERTERS[s].category.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Header Controls: Theme, Shortcuts, Settings, Palette, Nav */}
        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <select
            value={theme.id}
            onChange={(e) => {
              setThemeId(e.target.value);
              const selected = THEMES.find((t) => t.id === e.target.value);
              if (selected) showToast(`Theme: ${selected.name}`);
            }}
            className="cursor-pointer bg-transparent px-2 py-1 text-xs outline-none transition-colors hidden sm:block"
            style={{ color: theme.colors.muted }}
            aria-label="Select theme"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id} style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                🎨 {t.name}
              </option>
            ))}
          </select>

          {/* Shortcuts button */}
          <button
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts cheat sheet (?)"
            className="rounded px-2.5 py-1 font-mono text-xs font-semibold transition-colors hover:opacity-80"
            style={{
              backgroundColor: theme.colors.hover,
              color: theme.colors.fg,
            }}
          >
            ?
          </button>

          {/* Settings button */}
          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            className="rounded px-2 py-1 text-sm transition-colors hover:opacity-80"
            style={{ color: theme.colors.muted }}
            aria-label="Open settings"
          >
            ⚙️
          </button>

          {/* Command Palette button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="rounded px-2.5 py-1 font-mono text-xs font-semibold transition-colors hover:opacity-80 hidden md:block"
            style={{
              backgroundColor: theme.colors.hover,
              color: theme.colors.fg,
            }}
          >
            ⌘K
          </button>

          <span className="text-xs opacity-30 hidden sm:inline">|</span>

          {/* Quick Nav links */}
          <nav className="hidden lg:flex items-center gap-3 text-xs" style={{ color: theme.colors.muted }}>
            <Link href="/jsonpath" className="hover:underline">JSONPath</Link>
            <Link href="/json-diff" className="hover:underline">Diff</Link>
            <Link href="/jsonl-viewer" className="hover:underline">JSONL</Link>
            <Link href="/" className="hover:underline font-semibold" style={{ color: theme.colors.accent }}>
              ← Editor
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Dynamic Options Bar ── */}
      {config.options.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-4 border-b px-4 py-2 text-xs"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.panel,
          }}
        >
          <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: theme.colors.accent }}>
            Options:
          </span>
          {config.options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <label htmlFor={`opt-${opt.id}`} className="opacity-80">{opt.label}:</label>
              {opt.type === "select" && (
                <select
                  id={`opt-${opt.id}`}
                  value={String(options[opt.id] ?? opt.default)}
                  onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                  className="rounded border px-1.5 py-0.5 text-xs outline-none"
                  style={{
                    backgroundColor: theme.colors.bg,
                    color: theme.colors.fg,
                    borderColor: theme.colors.border,
                  }}
                >
                  {opt.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}

              {opt.type === "boolean" && (
                <input
                  id={`opt-${opt.id}`}
                  type="checkbox"
                  checked={Boolean(options[opt.id] ?? opt.default)}
                  onChange={(e) => handleOptionChange(opt.id, e.target.checked)}
                  className="cursor-pointer accent-blue-500"
                />
              )}

              {opt.type === "text" && (
                <input
                  id={`opt-${opt.id}`}
                  type="text"
                  value={String(options[opt.id] ?? opt.default)}
                  onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                  className="rounded border px-1.5 py-0.5 text-xs outline-none w-28"
                  style={{
                    backgroundColor: theme.colors.bg,
                    color: theme.colors.fg,
                    borderColor: theme.colors.border,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Dual Pane Workspace ── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left: Input Editor */}
        <div className="w-full md:w-1/2 flex flex-col border-r min-h-0" style={{ borderColor: theme.colors.border }}>
          <div
            className="flex items-center justify-between border-b px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel, color: theme.colors.muted }}
          >
            <span>JSON Input</span>
            <button
              onClick={() => setJsonText(config.sampleJson)}
              className="text-[11px] hover:underline font-normal"
              style={{ color: theme.colors.accent }}
            >
              Load Sample
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste JSON here…"
            className="flex-1 w-full p-4 font-mono text-xs leading-relaxed outline-none resize-none"
            style={{
              backgroundColor: theme.colors.bg,
              color: theme.colors.fg,
            }}
            spellCheck={false}
          />
        </div>

        {/* Right: Syntax-Highlighted Code Output with Line Numbers */}
        <div className="w-full md:w-1/2 flex flex-col min-h-0">
          <div
            className="flex items-center justify-between border-b px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel, color: theme.colors.muted }}
          >
            <span>Generated {config.targetName}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="rounded px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: theme.colors.hover,
                  color: theme.colors.fg,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="rounded px-2.5 py-0.5 text-xs font-semibold transition-colors hover:opacity-90"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: "#ffffff",
                }}
              >
                Download
              </button>
            </div>
          </div>

          <div
            className="flex-1 w-full overflow-auto p-4 font-mono text-xs leading-relaxed"
            style={{
              backgroundColor: theme.colors.panel,
              color: theme.colors.fg,
            }}
          >
            {tokenizedLines.map((lineTokens, lineIdx) => (
              <div key={lineIdx} className="flex gap-4">
                <span className="w-8 shrink-0 text-right select-none opacity-30" style={{ color: theme.colors.muted }}>
                  {lineIdx + 1}
                </span>
                <div className="whitespace-pre">
                  {lineTokens.map((tok, tokIdx) => (
                    <span key={tokIdx} style={{ color: getTokenColor(tok.type) }}>
                      {tok.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSettingsChange={(newSettings) => setThemeId(newSettings.themeId)}
        />
      )}
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          commands={commands}
          onSelectCommand={handleSelectCommand}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-xs font-mono font-medium shadow-2xl z-50"
          style={{ backgroundColor: theme.colors.accent, color: "#ffffff" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
