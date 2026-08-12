"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CommandPalette, type Command } from "@/components/CommandPalette";
import { EmptyState } from "@/components/EmptyState";
import { FormatOptionsPopover, loadFormatOptions } from "@/components/FormatOptionsPopover";
import { JsonEditorArea } from "@/components/JsonEditorArea";
import { JsonTree } from "@/components/JsonTree";
import { SearchBar, type SearchBarHandle } from "@/components/SearchBar";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { SideBySideDiff } from "@/components/SideBySideDiff";
import { useJsonDocument } from "@/hooks/useJsonDocument";
import { useRecentFiles } from "@/hooks/useRecentFiles";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { decodeLegacyGzipFragment, decodeShareFragment, encodeShareFragment } from "@/lib/share";
import { track, type LoadSource } from "@/lib/analytics";
import { PORTFOLIO_URL, GITHUB_URL, TWITTER_URL, LINKEDIN_URL } from "@/lib/site";
import { DEFAULT_FORMAT_OPTIONS, type FormatOptions, updateNodeValueAtPath, renameNodeKeyAtPath, deleteNodeAtPath, stringifyWithOptions } from "@/lib/json-document";
import { parseTolerantJSON } from "@/lib/json-parser";
import { SettingsModal } from "@/components/SettingsModal";
import { loadSettings, type AppSettings } from "@/lib/settings";
import { RepairModal } from "@/components/RepairModal";
import { repairJson, type RepairResult } from "@/lib/json-repair";
import { isJsonlContent, parseJsonl } from "@/lib/jsonl-parser";
import { JsonlViewer } from "@/components/JsonlViewer";
import { useDialog } from "@/components/DialogProvider";

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
    isInvalidRegex,
    goToMatch,
    revealPath,
    expandAll,
    collapseAll,
    sideBySideRows,
    compareError,
    compare,
    clearCompare,
    stringify,
  } = useJsonDocument();
  const { recent, record, clear: clearRecentFiles, removeOne: removeRecentOne } = useRecentFiles();
  const { theme, setThemeId, themes } = useTheme();
  const dialog = useDialog();

  const handleClearRecent = useCallback(async () => {
    const ok = await dialog.confirm({
      title: "Clear recent files",
      message: `Remove all ${recent.length} recent file${recent.length === 1 ? "" : "s"} from local history? This can't be undone.`,
      confirmLabel: "Clear",
      danger: true,
    });
    if (ok) clearRecentFiles();
  }, [dialog, recent.length, clearRecentFiles]);
  const searchInputRef = useRef<SearchBarHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState<string>("");
  const [viewLayout, setViewLayout] = useState<"split" | "tree" | "preview">("split");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(() =>
    typeof window !== "undefined" ? loadFormatOptions() : DEFAULT_FORMAT_OPTIONS
  );
  const [formatPopoverOpen, setFormatPopoverOpen] = useState(false);

  // Minifier stats — null = bar hidden, object = show stats
  type MinifyStats = { originalBytes: number; minifiedBytes: number; minifiedText: string };
  const [minifyStats, setMinifyStats] = useState<MinifyStats | null>(null);

  const [splitRatio, setSplitRatio] = useState<number>(() => {
    if (typeof window === "undefined") return 50;
    try { return Number(localStorage.getItem("devure-json:split-ratio")) || 50; } catch { return 50; }
  });
  const isDraggingRef = useRef(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadSettings());
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [isJsonlMode, setIsJsonlMode] = useState(false);

  const isJsonlDetected = useMemo(() => {
    if (!rawText.trim()) return false;
    return isJsonlContent(rawText);
  }, [rawText]);

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
      if (appSettings.historyEnabled) record(pendingSaveRef.current);
      pendingSaveRef.current = null;
    }
  }, [rows, isLoading, error, record, appSettings.historyEnabled]);

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

  function handleFileOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") openText(text, "paste");
    };
    reader.readAsText(file);
    // Reset so same file can be opened again
    e.target.value = "";
  }

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
    setFormatPopoverOpen(false);
    stringify("pretty", formatOptions).then((formatted) => {
      setRawText(formatted);
      currentTextRef.current = formatted;
      loadText(formatted);
      setToast("Formatted JSON");
    });
  }

  function handleDownload() {
    const text = currentTextRef.current;
    if (!text) return;
    track("feature_used", { feature: "download" });
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("JSON downloaded");
  }

  // Replace the text at the currently active match with the replacement string.
  // Operates on rawText so it works even when the tree doesn't expose the raw value.
  function handleReplace(replaceWith: string) {
    if (!rows || error) return;
    const text = currentTextRef.current;
    if (!text || !revealTarget) return;
    // Find the path segment at the end of revealTarget and use it as the search key in raw text
    // Simpler: just replace the first occurrence of the current searchQuery in the raw text
    const query = searchQuery;
    if (!query) return;
    const idx = text.indexOf(query);
    if (idx === -1) return;
    const newText = text.slice(0, idx) + replaceWith + text.slice(idx + query.length);
    currentTextRef.current = newText;
    setRawText(newText);
    loadText(newText);
    setToast("Replaced 1 match");
  }

  function handleReplaceAll(find: string, replaceWith: string) {
    if (!rows || error) return;
    const text = currentTextRef.current;
    if (!text || !find) return;
    const newText = text.split(find).join(replaceWith);
    if (newText === text) { setToast("No matches to replace"); return; }
    currentTextRef.current = newText;
    setRawText(newText);
    loadText(newText);
    setToast(`Replaced all occurrences of "${find}"`);
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

  // App-wide keyboard shortcuts beyond Cmd+K and '/'
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const inInput = document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT";

      // Ctrl+S — download
      if (meta && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (rows) handleDownload();
        return;
      }

      // Ctrl+F — focus search (same as '/')
      if (meta && !e.shiftKey && e.key.toLowerCase() === "f" && !inInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Ctrl+Shift+F — format
      if (meta && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (rows) handleFormatText();
        return;
      }

      // Ctrl+Shift+M — minify
      if (meta && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (rows) handleMinify();
        return;
      }

      // Ctrl+D — compare/diff
      if (meta && !e.shiftKey && e.key.toLowerCase() === "d" && !inInput) {
        e.preventDefault();
        if (rows && !isComparing) startCompare();
        return;
      }

      // Ctrl+O — open file
      if (meta && !e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      // Ctrl+Alt+F — open find & replace
      if (meta && e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.toggleReplace();
        searchInputRef.current?.focus();
        return;
      }

      // ? — Keyboard shortcuts cheat sheet
      if (e.key === "?" && !inInput) {
        e.preventDefault();
        setShortcutsModalOpen((open) => !open);
        return;
      }

      // Escape — clear search / exit compare / close any open panel
      if (e.key === "Escape" && !paletteOpen && !shortcutsModalOpen) {
        if (isComparing) {
          exitCompare();
          return;
        }
        if (searchQuery) {
          setSearchQuery("");
          search("");
          searchInputRef.current?.blur();
          return;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, isComparing, paletteOpen, searchQuery]);

  async function handleMinify() {
    if (!rows) return;
    track("feature_used", { feature: "minify" });
    const originalBytes = new TextEncoder().encode(rawText).length;
    const text = await stringify("compact");
    const minifiedBytes = new TextEncoder().encode(text).length;
    setMinifyStats({ originalBytes, minifiedBytes, minifiedText: text });
  }

  function handleRepair() {
    track("feature_used", { feature: "repair" });
    const res = repairJson(rawText);
    setRepairResult(res);
    setRepairModalOpen(true);
  }

  function handleEditNode(path: string, field: "key" | "value", newValue: string) {
    try {
      const parsed = parseTolerantJSON(rawText).value;
      if (parsed === null) return;
      const updated = field === "key"
        ? renameNodeKeyAtPath(parsed, path, newValue)
        : updateNodeValueAtPath(parsed, path, newValue);
      const text = stringifyWithOptions(updated, formatOptions);
      openText(text, "edit");
      setToast(field === "key" ? "Renamed key" : "Updated value");
    } catch {
      setToast("Failed to edit node");
    }
  }

  function handleDeleteNode(path: string) {
    try {
      const parsed = parseTolerantJSON(rawText).value;
      if (parsed === null) return;
      const updated = deleteNodeAtPath(parsed, path);
      const text = stringifyWithOptions(updated, formatOptions);
      openText(text, "edit");
      setToast("Deleted node");
    } catch {
      setToast("Failed to delete node");
    }
  }

  function handleConvertTo(slug: string) {
    track("feature_used", { feature: "convert" });
    stringify("pretty").then(async (text) => {
      const fragment = await encodeShareFragment(text);
      window.open(`/${slug}#${fragment}`, "_blank", "noopener");
    });
  }

  function handleSelectCommand(commandId: string) {
    if (commandId === "minify-json") {
      handleMinify();
    } else if (commandId === "repair-json") {
      handleRepair();
    } else if (commandId.startsWith("convert-to-")) {
      const slug = commandId.slice(11);
      handleConvertTo(slug);
    } else if (commandId === "toggle-jsonl") {
      track("feature_used", { feature: "jsonl_mode" });
      setIsJsonlMode((m) => !m);
    } else if (commandId === "open-settings") {
      setSettingsOpen(true);
    } else if (commandId === "open-schema-validator") {
      stringify("pretty").then(async (text) => {
        const fragment = await encodeShareFragment(text);
        window.open(`/json-schema-validator#${fragment}`, "_blank", "noopener");
      });
    } else if (commandId === "open-jwt-decoder") {
      window.open("/jwt-decoder", "_blank", "noopener");
    } else if (commandId === "open-api-response") {
      window.open("/api-response", "_blank", "noopener");
    } else if (commandId === "open-jsonpath") {
      // Encode current JSON into URL hash and navigate to the JSONPath page
      stringify("pretty").then(async (text) => {
        const fragment = await encodeShareFragment(text);
        window.open(`/jsonpath#${fragment}`, "_blank", "noopener");
      });
    } else if (commandId === "copy-formatted") {
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
    } else if (commandId === "download") {
      handleDownload();
    } else if (commandId === "share") {
      handleShare();
    } else if (commandId === "compare") {
      startCompare();
    } else if (commandId === "toggle-layout") {
      track("feature_used", { feature: "view_toggle" });
      setViewLayout((l) => l === "split" ? "tree" : l === "tree" ? "preview" : "split");
    } else if (commandId === "expand-all") {
      expandAll();
    } else if (commandId === "collapse-all") {
      collapseAll();
    } else if (commandId === "open-file") {
      fileInputRef.current?.click();
    } else if (commandId === "shortcuts-sheet") {
      setShortcutsModalOpen(true);
    } else if (commandId === "clear-recent") {
      handleClearRecent();
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

  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const mod = isMac ? "⌘" : "Ctrl";

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [];

    if (rows) {
      list.push(
        { id: "format-editor", label: "Format JSON", shortcut: `${mod}⇧F` },
        { id: "minify-json", label: "Minify JSON", shortcut: `${mod}⇧M` },
        { id: "copy-formatted", label: "Copy formatted JSON" },
        { id: "copy-minified", label: "Copy minified JSON" },
        { id: "download", label: "Download JSON", shortcut: `${mod}S` },
        { id: "share", label: "Share (copy link, no server)" },
        { id: "open-jsonpath", label: "Query with JSONPath…" },
        { id: "open-schema-validator", label: "Validate against JSON Schema…" },
        { id: "open-jwt-decoder", label: "Decode JWT Token…" },
        { id: "open-api-response", label: "Inspect API Response…" },
        { id: "convert-to-json-to-typescript", label: "Convert to TypeScript" },
        { id: "convert-to-json-to-python", label: "Convert to Python" },
        { id: "convert-to-json-to-go", label: "Convert to Go" },
        { id: "convert-to-json-to-rust", label: "Convert to Rust" },
        { id: "convert-to-json-to-java", label: "Convert to Java" },
        { id: "convert-to-json-to-csharp", label: "Convert to C#" },
        { id: "convert-to-json-to-swift", label: "Convert to Swift" },
        { id: "convert-to-json-to-javascript", label: "Convert to JavaScript" },
        { id: "convert-to-json-to-csv", label: "Convert to CSV" },
        { id: "convert-to-json-to-yaml", label: "Convert to YAML" },
        { id: "convert-to-json-to-xml", label: "Convert to XML" },
        { id: "convert-to-json-to-toml", label: "Convert to TOML" },
        { id: "convert-to-json-to-sql", label: "Convert to SQL" },
        { id: "toggle-jsonl", label: isJsonlMode ? "Exit JSONL mode" : "Switch to JSONL viewer" },
        { id: "compare", label: "Compare side-by-side with another document", shortcut: `${mod}D` },
        { id: "expand-all", label: "Expand all nodes" },
        { id: "collapse-all", label: "Collapse all nodes" },
        { id: "toggle-layout", label: `Toggle view layout (Current: ${viewLayout === "split" ? "Split" : viewLayout === "tree" ? "Tree" : "Preview"})` },
      );
    }

    if (stringParseError || error) {
      list.push({ id: "repair-json", label: "Repair JSON (detect, preview diff & fix errors)" });
    }

    list.push(
      { id: "shortcuts-sheet", label: "Keyboard Shortcuts Cheat Sheet", shortcut: "?" },
      { id: "open-settings", label: "Open settings", shortcut: `${mod},` },
      { id: "open-file", label: "Open file…", shortcut: `${mod}O` },
      { id: "clear-recent", label: "Clear recent files" },
    );

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
  }, [rows, themes, theme.id, viewLayout, mod, error, isJsonlMode, stringParseError]);

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

          <Link
            href="/privacy"
            className="hidden items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors hover:opacity-80 sm:flex"
            style={{ borderColor: theme.colors.border, color: theme.colors.muted }}
            title="This document is processed entirely in your browser — see how"
          >
            🔒 Local-only
          </Link>

          <nav className="flex items-center gap-3 font-mono text-xs" style={{ color: theme.colors.muted }}>
            <Link href="/json-diff" className="hover:opacity-80 hover:underline">
              Diff
            </Link>

            <Link href="/json-schema-validator" className="hover:opacity-80 hover:underline">
              Schema
            </Link>

            <Link href="/jwt-decoder" className="hover:opacity-80 hover:underline">
              JWT
            </Link>

            <Link href="/api-response" className="hover:opacity-80 hover:underline">
              API
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
                Split
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
                  borderLeft: `1px solid ${theme.colors.border}`,
                }}
              >
                Tree
              </button>
              <button
                onClick={() => {
                  track("feature_used", { feature: "view_toggle" });
                  setViewLayout("preview");
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors ${viewLayout === "preview" ? "font-bold" : ""}`}
                style={{
                  backgroundColor: viewLayout === "preview" ? theme.colors.active : "transparent",
                  color: theme.colors.fg,
                  borderLeft: `1px solid ${theme.colors.border}`,
                }}
              >
                Preview
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rows && !isComparing && (
            <div className="flex items-center gap-1.5">
              {/* Format button group */}
              <div className="relative flex items-stretch rounded overflow-hidden border" style={{ borderColor: theme.colors.border }}>
                <button
                  onClick={handleFormatText}
                  title="Format JSON (Ctrl+Shift+F)"
                  className="px-2.5 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: theme.colors.hover,
                    color: theme.colors.fg,
                  }}
                >
                  Format
                </button>
                <button
                  onClick={() => setFormatPopoverOpen((o) => !o)}
                  title="Format options"
                  className="px-1.5 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: theme.colors.hover,
                    color: theme.colors.muted,
                    borderLeft: `1px solid ${theme.colors.border}`,
                  }}
                  aria-label="Open format options"
                >
                  ▾
                </button>
                {formatPopoverOpen && (
                  <FormatOptionsPopover
                    options={formatOptions}
                    onChange={(opts) => setFormatOptions(opts)}
                    onClose={() => setFormatPopoverOpen(false)}
                  />
                )}
              </div>

              {/* Minify button */}
              <button
                onClick={handleMinify}
                title="Minify JSON (Ctrl+Shift+M)"
                className="rounded px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: theme.colors.hover,
                  color: theme.colors.fg,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                Minify
              </button>
            </div>
          )}

          {/* Hidden file input for Open File */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.jsonc,.txt,text/plain,application/json"
            className="hidden"
            onChange={handleFileOpen}
            aria-label="Open JSON file"
          />

          {/* Open File button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Open file (Ctrl+O)"
            className="px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: theme.colors.muted }}
          >
            Open
          </button>

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
              <button
                onClick={() => {
                  stringify("pretty").then(async (text) => {
                    const fragment = await encodeShareFragment(text);
                    window.open(`/jsonpath#${fragment}`, "_blank", "noopener");
                  });
                }}
                className="px-2.5 py-1 text-xs transition-colors hover:opacity-80"
                style={{ color: theme.colors.muted }}
                title="Open current JSON in the JSONPath playground"
              >
                JSONPath…
              </button>
              <button
                onClick={() => {
                  stringify("pretty").then(async (text) => {
                    const fragment = await encodeShareFragment(text);
                    window.open(`/json-schema-validator#${fragment}`, "_blank", "noopener");
                  });
                }}
                className="px-2.5 py-1 text-xs transition-colors hover:opacity-80"
                style={{ color: theme.colors.muted }}
                title="Validate the current JSON against a schema"
              >
                Schema…
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) handleConvertTo(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="cursor-pointer bg-transparent px-2 py-1 text-xs outline-none transition-colors"
                style={{ color: theme.colors.muted }}
                aria-label="Convert JSON to code or data format"
              >
                <option value="" disabled style={{ backgroundColor: theme.colors.panel, color: theme.colors.muted }}>
                  Convert to…
                </option>
                <option value="json-to-typescript" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  TypeScript
                </option>
                <option value="json-to-python" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  Python
                </option>
                <option value="json-to-go" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  Go
                </option>
                <option value="json-to-rust" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  Rust
                </option>
                <option value="json-to-java" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  Java
                </option>
                <option value="json-to-csharp" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  C#
                </option>
                <option value="json-to-swift" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  Swift
                </option>
                <option value="json-to-javascript" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  JavaScript
                </option>
                <option value="json-to-csv" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  CSV
                </option>
                <option value="json-to-yaml" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  YAML
                </option>
                <option value="json-to-xml" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  XML
                </option>
                <option value="json-to-toml" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  TOML
                </option>
                <option value="json-to-sql" style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  SQL
                </option>
              </select>
            </>
          )}

          <button
            onClick={() => setShortcutsModalOpen(true)}
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

      {/* JSONL Detection Banner */}
      {!isJsonlMode && isJsonlDetected && (
        <div
          className="flex flex-wrap items-center justify-between border-b px-4 py-2 text-xs font-mono"
          style={{
            backgroundColor: `${theme.colors.accent}20`,
            borderColor: theme.colors.border,
            color: theme.colors.fg,
          }}
        >
          <span>💡 Line-delimited JSON (JSONL / NDJSON) detected in this file.</span>
          <button
            onClick={() => {
              track("feature_used", { feature: "jsonl_mode" });
              setIsJsonlMode(true);
            }}
            className="rounded px-2.5 py-1 font-semibold transition-colors hover:opacity-90"
            style={{
              backgroundColor: theme.colors.accent,
              color: "#ffffff",
            }}
          >
            Switch to JSONL Viewer →
          </button>
        </div>
      )}

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
            <div className="flex items-center gap-3">
              <div className="max-w-md truncate text-xs opacity-90">
                {stringParseError.snippet ? `Snippet: "${stringParseError.snippet}"` : stringParseError.message}
              </div>
              <button
                onClick={() => {
                  track("feature_used", { feature: "repair" });
                  const res = repairJson(rawText);
                  setRepairResult(res);
                  setRepairModalOpen(true);
                }}
                className="rounded px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-90 shrink-0"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#c0392b",
                }}
              >
                🔧 Repair JSON
              </button>
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
          isInvalidRegex={isInvalidRegex}
          rawText={rawText}
          canReplace={!!rows && !error}
          allMatches={matches}
          onRevealPath={revealPath}
          onQueryChange={(q, opts) => {
            // Once per search session (fires again only after the box is
            // cleared), so a 20-character query isn't 20 events.
            if (q && !searchQuery) track("feature_used", { feature: "search" });
            setSearchQuery(q);
            search(q, opts);
          }}
          onNext={() => goToMatch(1)}
          onPrev={() => goToMatch(-1)}
          onReplace={handleReplace}
          onReplaceAll={(find, replace) => handleReplaceAll(find, replace)}
        />
      )}

      {/* Minifier Stats Bar */}
      {minifyStats && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 font-mono text-xs"
          style={{
            backgroundColor: theme.colors.panel,
            borderColor: theme.colors.border,
            color: theme.colors.fg,
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Original:{" "}
              <strong>{minifyStats.originalBytes >= 1024 * 1024
                ? `${(minifyStats.originalBytes / 1024 / 1024).toFixed(2)} MB`
                : `${(minifyStats.originalBytes / 1024).toFixed(1)} KB`}</strong>
            </span>
            <span style={{ color: theme.colors.muted }}>→</span>
            <span>
              Minified:{" "}
              <strong style={{ color: theme.colors.accent }}>
                {minifyStats.minifiedBytes >= 1024 * 1024
                  ? `${(minifyStats.minifiedBytes / 1024 / 1024).toFixed(2)} MB`
                  : `${(minifyStats.minifiedBytes / 1024).toFixed(1)} KB`}
              </strong>
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${theme.colors.accent}25`,
                color: theme.colors.accent,
              }}
            >
              Saved{" "}
              {minifyStats.originalBytes > 0
                ? `${Math.round((1 - minifyStats.minifiedBytes / minifyStats.originalBytes) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(minifyStats.minifiedText);
                setToast("Copied minified JSON");
              }}
              className="rounded px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: theme.colors.hover,
                color: theme.colors.fg,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              Copy minified
            </button>
            <button
              onClick={() => {
                const blob = new Blob([minifyStats.minifiedText], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "document.min.json";
                a.click();
                URL.revokeObjectURL(url);
                setToast("Downloaded document.min.json");
              }}
              className="rounded px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: theme.colors.hover,
                color: theme.colors.fg,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              Download .min.json
            </button>
            <button
              onClick={() => setMinifyStats(null)}
              title="Dismiss"
              className="px-1.5 py-1 text-xs opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: theme.colors.muted }}
              aria-label="Close minifier stats"
            >
              ✕
            </button>
          </div>
        </div>
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
        {isJsonlMode ? (
          <JsonlViewer
            summary={parseJsonl(rawText)}
            onExitJsonl={() => setIsJsonlMode(false)}
          />
        ) : (
          <>
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
            <div
              className="flex h-full w-full overflow-hidden select-none"
              onMouseMove={(e) => {
                if (!isDraggingRef.current) return;
                const container = e.currentTarget;
                const rect = container.getBoundingClientRect();
                const ratio = Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100));
                setSplitRatio(ratio);
                try { localStorage.setItem("devure-json:split-ratio", String(ratio)); } catch { /* ignore */ }
              }}
              onMouseUp={() => { isDraggingRef.current = false; }}
              onMouseLeave={() => { isDraggingRef.current = false; }}
            >
              {/* Left Pane: Syntax-Highlighted Themed JSON Editor */}
              <div
                className="flex flex-col overflow-hidden"
                style={{ width: `${splitRatio}%`, minWidth: 0 }}
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

              {/* Drag Handle */}
              <div
                className="group relative z-10 flex w-2 shrink-0 cursor-col-resize items-center justify-center transition-colors"
                style={{ backgroundColor: theme.colors.border }}
                onMouseDown={(e) => { e.preventDefault(); isDraggingRef.current = true; }}
                title="Drag to resize panes"
              >
                <div
                  className="h-8 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>

              {/* Right Pane: Interactive Virtualized Tree Cells */}
              <div className="flex-1 overflow-hidden min-w-0">
                <JsonTree
                  rows={rows}
                  onToggle={toggle}
                  revealTarget={revealTarget}
                  searchQuery={searchQuery}
                  onToast={setToast}
                  onEditNode={handleEditNode}
                  onDeleteNode={handleDeleteNode}
                />
              </div>
            </div>
          ) : viewLayout === "preview" ? (
            /* Preview mode — read-only calm presentation, no edit affordances */
            <div className="flex h-full flex-col overflow-hidden">
              <div
                className="flex items-center justify-between border-b px-4 py-2 text-xs font-mono"
                style={{
                  backgroundColor: theme.colors.panel,
                  borderColor: theme.colors.border,
                  color: theme.colors.muted,
                }}
              >
                <span className="uppercase tracking-wider text-[11px] font-semibold">Preview — Read Only</span>
                <span className="text-[11px] opacity-60">Switch to Split or Tree to edit</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <JsonTree
                  rows={rows}
                  onToggle={toggle}
                  revealTarget={revealTarget}
                  searchQuery={searchQuery}
                  onToast={setToast}
                  readOnly={true}
                />
              </div>
            </div>
          ) : (
            <JsonTree
              rows={rows}
              onToggle={toggle}
              revealTarget={revealTarget}
              searchQuery={searchQuery}
              onToast={setToast}
              onEditNode={handleEditNode}
              onDeleteNode={handleDeleteNode}
            />
          )
        )}

            {!error && !isLoading && !rows && (
              <EmptyState
                recent={recent}
                onSelect={(text) => openText(text, "recent")}
                onClear={handleClearRecent}
                onRemoveOne={removeRecentOne}
              />
            )}
          </>
        )}
      </main>

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onSelectCommand={handleSelectCommand}
          commands={commands}
        />
      )}

      {shortcutsModalOpen && (
        <ShortcutsModal onClose={() => setShortcutsModalOpen(false)} />
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSettingsChange={(s) => {
            // Turning history off is a privacy choice — honor it by wiping
            // what's already stored, not just stopping future writes.
            if (appSettings.historyEnabled && !s.historyEnabled) clearRecentFiles();
            setAppSettings(s);
            // Sync theme immediately from settings
            if (s.themeId !== theme.id) setThemeId(s.themeId);
          }}
        />
      )}

      {repairModalOpen && repairResult && (
        <RepairModal
          originalText={rawText}
          repairResult={repairResult}
          onClose={() => setRepairModalOpen(false)}
          onApprove={(repairedText) => {
            openText(repairedText, "edit");
            setToast("Applied repaired JSON");
            setRepairModalOpen(false);
          }}
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
