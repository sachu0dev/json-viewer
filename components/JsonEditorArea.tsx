"use client";

import { useMemo, useRef } from "react";
import { highlightJsonToTokens } from "@/lib/json-highlighter";
import type { Theme } from "@/lib/themes";

export function JsonEditorArea({
  value,
  onChange,
  theme,
  searchQuery,
}: {
  value: string;
  onChange: (val: string) => void;
  theme: Theme;
  searchQuery?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const highlightedHtml = useMemo(
    () => highlightJsonToTokens(value, theme.colors, searchQuery),
    [value, theme.colors, searchQuery]
  );

  const lineCount = useMemo(() => {
    if (!value) return 1;
    return value.split("\n").length;
  }, [value]);

  const lineNumbersHtml = useMemo(() => {
    const lines = [];
    for (let i = 1; i <= lineCount; i++) {
      lines.push(i);
    }
    return lines.join("\n");
  }, [lineCount]);

  function handleScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const top = e.currentTarget.scrollTop;
    const left = e.currentTarget.scrollLeft;
    if (preRef.current) {
      preRef.current.scrollTop = top;
      preRef.current.scrollLeft = left;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = top;
    }
  }

  return (
    <div
      className="relative flex h-full w-full overflow-hidden font-mono text-xs"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
    >
      {/* Line Numbers Column */}
      <div
        ref={lineNumbersRef}
        className="select-none overflow-hidden py-3 pl-3 pr-2 text-right opacity-50"
        style={{
          color: theme.colors.muted,
          borderRightWidth: "1px",
          borderRightStyle: "solid",
          borderRightColor: theme.colors.border,
          backgroundColor: theme.colors.panel,
          minWidth: "3.2rem",
          lineHeight: "1.5rem",
        }}
      >
        <pre className="m-0 font-mono text-xs">{lineNumbersHtml}</pre>
      </div>

      {/* Editor Main Container */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Underlying Syntax-Highlighted HTML */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word"
          style={{
            lineHeight: "1.5rem",
            color: theme.colors.fg,
          }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml + "\n" }}
        />

        {/* Overlaid Transparent Textarea for User Editing */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder="Paste or type JSON or JS object literal here…"
          className="absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-3 font-mono text-xs outline-none whitespace-pre-wrap wrap-break-word"
          style={{
            lineHeight: "1.5rem",
            color: "transparent",
            caretColor: theme.colors.accent,
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
