"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CommandPalette, type Command } from "@/components/CommandPalette";
import { EmptyState } from "@/components/EmptyState";
import { JsonEditorArea } from "@/components/JsonEditorArea";
import { JsonTree } from "@/components/JsonTree";
import { SearchBar } from "@/components/SearchBar";
import { SideBySideDiff } from "@/components/SideBySideDiff";
import { useJsonDocument } from "@/hooks/useJsonDocument";
import { useRecentFiles } from "@/hooks/useRecentFiles";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { decodeLegacyGzipFragment, decodeShareFragment, encodeShareFragment } from "@/lib/share";
import { track, type LoadSource } from "@/lib/analytics";
import { PORTFOLIO_URL, GITHUB_URL, TWITTER_URL, LINKEDIN_URL } from "@/lib/site";

function tryAutoFormat(text: string): string {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
}

export function ViewerAppContent({
  onActiveChange,
  headerSlot,
}: {
  onActiveChange?: (active: boolean) => void;
  headerSlot?: ReactNode;
}) {
  const {
    rows,
    error,
    parseMode,
    stringParseError,
    jsEvalStatus,
    isLoading,
    loadText,
    toggle,
    search,
    matches,
    activeMatchIndex,
    revealTarget,
    goToMatch,
    sideBySideRows,
    compareError,
    compare,
    clearCompare,
    stringify,
  } = useJsonDocument();
  const { recent, record, clear: clearRecentFiles } = useRecentFiles();
  const { theme, setThemeId, themes } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState<string>("");
  const [viewLayout, setViewLayout] = useState<"split" | "tree">("split");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isComparing, setIsComparing] = useState(false);
  const isComparingRef = useRef(isComparing);
  useEffect(() => {
    isComparingRef.current = isComparing;
  }, [isComparing]);

  useEffect(() => {
    onActiveChange?.(Boolean(rows));
  }, [rows, onActiveChange]);

  // Completing the compare funnel: started -> a second document actually landed
  // and produced a diff. compare_started without this is the abandon signal.
  useEffect(() => {
    if (!sideBySideRows) return;
    track("compare_completed", {
      changed_count: sideBySideRows.filter((r) => r.status !== "same").length,
    });
  }, [sideBySideRows]);

  const pendingSaveRef = useRef<string | null>(null);
  useEffect(() => {
    if (rows && !isLoading && !error && pendingSaveRef.current !== null) {
      record(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }
  }, [rows, isLoading, error, record]);

  // Set when a document enters from outside the editor; consumed once the
  // worker reports back, so the outcome (activated vs. bounced off a parse
  // error) is attributed to how the document arrived.
  const pendingLoadRef = useRef<{ source: LoadSource; size: number } | null>(null);
  useEffect(() => {
    const pending = pendingLoadRef.current;
    if (!pending || isLoading) return;
    // `error` first: rows now survive a failed reparse (stale-while-revalidate),
    // so a non-null `rows` no longer implies the latest parse succeeded.
    if (error) {
      pendingLoadRef.current = null;
      track("json_parse_failed", {
        source: pending.source,
        size_bytes: pending.size,
        error_line: error.line,
      });
    } else if (rows) {
      pendingLoadRef.current = null;
      track("json_loaded", {
        source: pending.source,
        size_bytes: pending.size,
        parse_mode: parseMode,
        row_count: rows.length,
      });
    }
  }, [rows, error, isLoading, parseMode]);

  const currentTextRef = useRef<string | null>(null);
  const editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
    };
  }, []);

  // Debounced so a full reparse doesn't run on every keystroke — instant
  // loads (paste/drop/open/recent-file) call loadText directly and skip this.
  const hasTrackedEditRef = useRef(false);
  const handleEditorChange = useCallback(
    (text: string) => {
      setRawText(text);
      currentTextRef.current = text;
      // Once per document, not per keystroke: editing fires every 300ms pause,
      // and per-parse events here would swamp the funnel with transient
      // mid-typing states that mean nothing. Deliberately no json_loaded /
      // json_parse_failed for edits either — half-typed JSON is *expected* to
      // be invalid, so counting it as failure would poison the friction metric.
      if (!hasTrackedEditRef.current) {
        hasTrackedEditRef.current = true;
        track("document_edited", { size_bytes: text.length });
      }
      if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
      editDebounceRef.current = setTimeout(() => loadText(text), 300);
    },
    [loadText],
  );
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  const openText = useCallback(
    (text: string, source: LoadSource = "paste") => {
      const formatted = tryAutoFormat(text);
      pendingSaveRef.current = formatted;
      currentTextRef.current = formatted;
      pendingLoadRef.current = { source, size: text.length };
      hasTrackedEditRef.current = false;
      setRawText(formatted);
      setShareStatus("idle");
      loadText(formatted);
    },
    [loadText],
  );

  const handleIncomingText = useCallback(
    (text: string, source: LoadSource = "paste") => {
      if (isComparingRef.current) {
        compare(text);
      } else {
        openText(text, source);
      }
    },
    [compare, openText],
  );

  useEffect(() => {
    function loadFromHash() {
      const hash = window.location.hash;
      // `#z=` is the current (deflate-raw) format; `#d=` is the older gzip one,
      // still decoded so links shared before the switch keep working.
      const decode = hash.startsWith("#z=")
        ? decodeShareFragment
        : hash.startsWith("#d=")
          ? decodeLegacyGzipFragment
          : null;
      if (!decode) return;
      const fragment = hash.slice(3);
      // Fired here rather than after decode so an inbound share is counted even
      // if the payload turns out to be corrupt — a truncated link that fails to
      // open is exactly the kind of loss worth seeing in the funnel.
      track("share_link_opened", { fragment_chars: fragment.length });
      decode(fragment)
        .then((text) => openText(text, "share_link"))
        .catch(() => {});
    }
    loadFromHash();

    // Pasting a share link into the address bar of a tab already on the app is
    // a same-document navigation — it fires hashchange and never remounts, so
    // without this the link silently does nothing.
    window.addEventListener("hashchange", loadFromHash);
    return () => window.removeEventListener("hashchange", loadFromHash);
  }, [openText]);

  const handleShare = useCallback(async () => {
    const text = currentTextRef.current;
    if (!text) return;
    try {
      const fragment = await encodeShareFragment(text);
      const url = `${window.location.origin}${window.location.pathname}#z=${fragment}`;
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      track("share_link_created", { size_bytes: text.length, fragment_chars: fragment.length });
    } catch {
      setShareStatus("error");
    }
  }, []);

  useEffect(() => {
    if (shareStatus === "idle") return;
    const timer = setTimeout(() => setShareStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [shareStatus]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") {
        return;
      }
      const text = e.clipboardData?.getData("text/plain");
      if (text) handleIncomingText(text);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleIncomingText]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== searchInputRef.current && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleIncomingText(await file.text(), "drop");
    },
    [handleIncomingText],
  );

  function startCompare() {
    setIsComparing(true);
    track("compare_started");
  }

  function exitCompare() {
    setIsComparing(false);
    clearCompare();
  }

  function handleFormatText() {
    track("feature_used", { feature: "format" });
    stringify("pretty").then((formatted) => {
      setRawText(formatted);
      currentTextRef.current = formatted;
      loadText(formatted);
      setToast("Formatted JSON with clean indentation");
    });
  }

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSelectCommand(commandId: string) {
    if (commandId === "copy-formatted") {
      track("feature_used", { feature: "copy_formatted" });
      stringify("pretty")
        .then((text) => navigator.clipboard.writeText(text))
        .then(() => setToast("Copied formatted JSON"));
    } else if (commandId === "copy-minified") {
      track("feature_used", { feature: "copy_minified" });
      stringify("compact")
        .then((text) => navigator.clipboard.writeText(text))
        .then(() => setToast("Copied minified JSON"));
    } else if (commandId === "format-editor") {
      handleFormatText();
    } else if (commandId === "share") {
      handleShare();
    } else if (commandId === "compare") {
      startCompare();
    } else if (commandId === "toggle-layout") {
      track("feature_used", { feature: "view_toggle" });
      setViewLayout((l) => (l === "split" ? "tree" : "split"));
    } else if (commandId === "clear-recent") {
      clearRecentFiles();
    } else if (commandId.startsWith("theme-")) {
      const targetThemeId = commandId.slice(6);
      track("feature_used", { feature: "theme_change" });
      setThemeId(targetThemeId);
      const selected = themes.find((t) => t.id === targetThemeId);
      if (selected) setToast(`Theme changed to ${selected.name}`);
    } else if (commandId === "portfolio") {
      window.open(PORTFOLIO_URL, "_blank", "noopener,noreferrer");
    } else if (commandId === "github") {
      window.open(GITHUB_URL, "_blank", "noopener,noreferrer");
    } else if (commandId === "twitter") {
      window.open(TWITTER_URL, "_blank", "noopener,noreferrer");
    } else if (commandId === "linkedin") {
      window.open(LINKEDIN_URL, "_blank", "noopener,noreferrer");
    }
  }

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [];

    if (rows) {
      list.push(
        { id: "format-editor", label: "Format JSON" },
        { id: "copy-formatted", label: "Copy formatted JSON" },
        { id: "copy-minified", label: "Copy minified JSON" },
        { id: "share", label: "Share (copy link, no server)" },
        { id: "compare", label: "Compare side-by-side with another document" },
        { id: "toggle-layout", label: `Toggle view layout (Current: ${viewLayout})` },
      );
    }

    list.push({ id: "clear-recent", label: "Clear recent files" });

    for (const t of themes) {
      list.push({
        id: `theme-${t.id}`,
        label: `Theme: ${t.name}${t.id === theme.id ? " (Active)" : ""}`,
      });
    }

    list.push(
      { id: "portfolio", label: "Portfolio — devure.in ↗" },
      { id: "github", label: "GitHub — sachu0dev ↗" },
      { id: "twitter", label: "Twitter/X — sachu0dev ↗" },
      { id: "linkedin", label: "LinkedIn — sachu0dev ↗" },
    );

    return list;
  }, [rows, themes, theme.id, viewLayout]);

  return (
    <div
      className="flex h-full w-full flex-col transition-colors duration-150"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.panel,
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-xs font-bold tracking-wider uppercase hover:opacity-80"
            style={{ color: theme.colors.accent }}
          >
            JSON Viewer
          </Link>

          <nav className="flex items-center gap-3 font-mono text-xs" style={{ color: theme.colors.muted }}>
            <Link href="/json-diff" className="hover:opacity-80 hover:underline">
              Diff
            </Link>
            <Link href="/large-files" className="hover:opacity-80 hover:underline">
              Large files
            </Link>
          </nav>

          {rows && !isComparing && (
            <div className="flex items-center rounded overflow-hidden border" style={{ borderColor: theme.colors.border }}>
              <button
                onClick={() => {
                  track("feature_used", { feature: "view_toggle" });
                  setViewLayout("split");
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors ${viewLayout === "split" ? "font-bold" : ""}`}
                style={{
                  backgroundColor: viewLayout === "split" ? theme.colors.active : "transparent",
                  color: theme.colors.fg,
                }}
              >
                Split View
              </button>
              <button
                onClick={() => {
                  track("feature_used", { feature: "view_toggle" });
                  setViewLayout("tree");
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors ${viewLayout === "tree" ? "font-bold" : ""}`}
                style={{
                  backgroundColor: viewLayout === "tree" ? theme.colors.active : "transparent",
                  color: theme.colors.fg,
                }}
              >
                Tree View
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rows && !isComparing && (
            <button
              onClick={handleFormatText}
              title="Auto-format raw JSON in editor"
              className="px-2.5 py-1 text-xs rounded font-medium transition-colors"
              style={{
                backgroundColor: theme.colors.hover,
                color: theme.colors.fg,
              }}
            >
              Format
            </button>
          )}

          <select
            value={theme.id}
            onChange={(e) => {
              track("feature_used", { feature: "theme_change" });
              setThemeId(e.target.value);
              const selected = themes.find((t) => t.id === e.target.value);
              if (selected) setToast(`Theme: ${selected.name}`);
            }}
            className="cursor-pointer bg-transparent px-2 py-1 text-xs outline-none transition-colors"
            style={{ color: theme.colors.muted }}
            aria-label="Select theme"
          >
            {themes.map((t) => (
              <option
                key={t.id}
                value={t.id}
                style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}
              >
                🎨 {t.name}
              </option>
            ))}
          </select>

          {rows && !isComparing && (
            <>
              <button
                onClick={handleShare}
                className="px-2.5 py-1 text-xs transition-colors hover:opacity-80"
                style={{ color: theme.colors.muted }}
              >
                {shareStatus === "copied" ? "Link copied" : shareStatus === "error" ? "Copy failed" : "Share"}
              </button>
              <button
                onClick={startCompare}
                className="px-2.5 py-1 text-xs transition-colors hover:opacity-80"
                style={{ color: theme.colors.muted }}
              >
                Compare…
              </button>
            </>
          )}

          <button
            onClick={() => {
              track("feature_used", { feature: "command_palette" });
              setPaletteOpen(true);
            }}
            className="rounded px-2.5 py-1 font-mono text-xs font-semibold transition-colors hover:opacity-80"
            style={{
              backgroundColor: theme.colors.hover,
              color: theme.colors.fg,
            }}
          >
            ⌘K
          </button>
        </div>
      </div>

      {headerSlot}

      {/* Parse Status / Error Banner */}
      {(stringParseError || parseMode !== "strict") && (rows || error) && (
        <div
          className="flex flex-wrap items-center justify-between border-b px-4 py-2 text-xs font-mono"
          style={{
            backgroundColor: stringParseError ? "#c0392b" : theme.colors.panel,
            color: stringParseError ? "#ffffff" : theme.colors.fg,
            borderColor: theme.colors.border,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold">
              {stringParseError
                ? `String parse: ${stringParseError.line > 0 ? `1 error (line ${stringParseError.line}, col ${stringParseError.column})` : "1 error"}`
                : "String parse: Valid"}
            </span>
            <span className="opacity-80">
              JS eval: <strong className="uppercase">{jsEvalStatus}</strong>
            </span>
            {parseMode === "partial" && (
              <span className="rounded bg-yellow-500/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
                Partial Recovery
              </span>
            )}
          </div>
          {stringParseError && (
            <div className="max-w-xl truncate text-xs opacity-90">
              {stringParseError.snippet ? `Snippet: "${stringParseError.snippet}"` : stringParseError.message}
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      {rows && !isComparing && (
        <SearchBar
          ref={searchInputRef}
          matchCount={matches.length}
          activeMatchIndex={activeMatchIndex}
          activeMatchPath={revealTarget}
          onQueryChange={(q) => {
            // Once per search session (fires again only after the box is
            // cleared), so a 20-character query isn't 20 events.
            if (q && !searchQuery) track("feature_used", { feature: "search" });
            setSearchQuery(q);
            search(q);
          }}
          onNext={() => goToMatch(1)}
          onPrev={() => goToMatch(-1)}
        />
      )}

      {/* Compare Mode Header */}
      {rows && isComparing && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.panel,
          }}
        >
          <span className="text-sm font-medium" style={{ color: theme.colors.fg }}>
            {sideBySideRows ? "Side-by-Side Visual Document Comparison" : "Paste (⌘V) second JSON to compare"}
          </span>
          <button
            onClick={exitCompare}
            className="text-xs rounded px-2.5 py-1 transition-colors hover:opacity-80"
            style={{
              backgroundColor: theme.colors.hover,
              color: theme.colors.fg,
            }}
          >
            Exit compare
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="min-h-0 flex-1 overflow-hidden">
        {error && !rows && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="font-mono text-sm font-semibold" style={{ color: theme.colors.diffRemoved }}>
              {error.message}
            </p>
            {error.snippet && (
              <p className="max-w-md truncate font-mono text-xs opacity-80" style={{ color: theme.colors.muted }}>
                Snippet: {error.snippet}
              </p>
            )}
          </div>
        )}

        {!error && isLoading && !rows && (
          <div className="flex h-full w-full items-center justify-center font-mono text-sm" style={{ color: theme.colors.muted }}>
            Parsing document…
          </div>
        )}

        {/* Once a document has parsed successfully once, keep the editor/tree
            mounted and showing the last-good rows even if a later keystroke
            is transiently invalid — only the status banner above reflects
            the current error. Remounting this on every error was the cause
            of the flicker/scroll-to-top bug. */}
        {rows && isComparing && (
          compareError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-8 text-center">
              <p className="font-mono text-sm" style={{ color: theme.colors.diffRemoved }}>
                {compareError.message}
              </p>
            </div>
          ) : sideBySideRows ? (
            <SideBySideDiff rows={sideBySideRows} />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-8 text-center text-sm" style={{ color: theme.colors.muted }}>
              Paste (⌘V) or drag and drop the second JSON document to compare side-by-side
            </div>
          )
        )}

        {rows && !isComparing && (
          viewLayout === "split" ? (
            <div className="flex h-full w-full overflow-hidden">
              {/* Left Pane: Syntax-Highlighted Themed JSON Editor */}
              <div
                className="flex flex-1 flex-col border-r overflow-hidden"
                style={{ borderColor: theme.colors.border }}
              >
                <div
                  className="flex items-center justify-between border-b px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: theme.colors.panel,
                    borderColor: theme.colors.border,
                    color: theme.colors.muted,
                  }}
                >
                  <span>JSON Editor</span>
                  <button
                    onClick={handleFormatText}
                    className="text-[11px] hover:underline"
                    style={{ color: theme.colors.accent }}
                  >
                    Format
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  <JsonEditorArea
                    value={rawText}
                    onChange={handleEditorChange}
                    theme={theme}
                    searchQuery={searchQuery}
                  />
                </div>
              </div>

              {/* Right Pane: Interactive Virtualized Tree Cells */}
              <div className="flex-1 overflow-hidden">
                <JsonTree
                  rows={rows}
                  onToggle={toggle}
                  revealTarget={revealTarget}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          ) : (
            <JsonTree
              rows={rows}
              onToggle={toggle}
              revealTarget={revealTarget}
              searchQuery={searchQuery}
            />
          )
        )}

        {!error && !isLoading && !rows && (
          <EmptyState
            recent={recent}
            onSelect={(text) => openText(text, "recent")}
            onClear={clearRecentFiles}
          />
        )}
      </main>

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onSelectCommand={handleSelectCommand}
          commands={commands}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-xl transition-all z-50"
          style={{
            backgroundColor: theme.colors.panel,
            borderColor: theme.colors.border,
            borderWidth: "1px",
            borderStyle: "solid",
            color: theme.colors.fg,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export function ViewerApp({
  onActiveChange,
  headerSlot,
}: { onActiveChange?: (active: boolean) => void; headerSlot?: ReactNode } = {}) {
  return (
    <ThemeProvider>
      <ViewerAppContent onActiveChange={onActiveChange} headerSlot={headerSlot} />
    </ThemeProvider>
  );
}
