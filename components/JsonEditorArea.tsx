"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findMatchingBracket } from "@/lib/bracket-matcher";
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

  const [cursorPos, setCursorPos] = useState<number>(0);
  const [jumpDialogOpen, setJumpDialogOpen] = useState<boolean>(false);
  const [jumpLineInput, setJumpLineInput] = useState<string>("");
  const jumpInputRef = useRef<HTMLInputElement>(null);

  const bracketPair = useMemo(() => {
    return findMatchingBracket(value, cursorPos);
  }, [value, cursorPos]);

  const highlightedHtml = useMemo(() => {
    let html = highlightJsonToTokens(value, theme.colors, searchQuery);

    // If matching brackets are found, inject outline styling into the pre element html
    if (bracketPair) {
      const [pos1, pos2] = bracketPair;
      const styleAttr = `style="outline: 1.5px solid ${theme.colors.accent}; background-color: ${theme.colors.accent}40; border-radius: 2px;"`;

      let curr = 0;
      let out = "";
      let inTag = false;
      let pos1Done = false;
      let pos2Done = false;

      for (let i = 0; i < html.length; i++) {
        const char = html[i];
        if (char === "<") {
          inTag = true;
          out += char;
          continue;
        }
        if (char === ">") {
          inTag = false;
          out += char;
          continue;
        }
        if (inTag) {
          out += char;
          continue;
        }

        if (char === "&") {
          const entityEnd = html.indexOf(";", i);
          if (entityEnd !== -1) {
            const entity = html.slice(i, entityEnd + 1);
            if ((curr === pos1 && !pos1Done) || (curr === pos2 && !pos2Done)) {
              out += `<span ${styleAttr}>${entity}</span>`;
              if (curr === pos1) pos1Done = true;
              if (curr === pos2) pos2Done = true;
            } else {
              out += entity;
            }
            i = entityEnd;
            curr++;
            continue;
          }
        }

        if ((curr === pos1 && !pos1Done) || (curr === pos2 && !pos2Done)) {
          out += `<span ${styleAttr}>${char}</span>`;
          if (curr === pos1) pos1Done = true;
          if (curr === pos2) pos2Done = true;
        } else {
          out += char;
        }
        curr++;
      }
      return out;
    }

    return html;
  }, [value, theme.colors, searchQuery, bracketPair]);

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

  function handleSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    setCursorPos(e.currentTarget.selectionStart);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl+G / Cmd+G — Jump to Line
    if (mod && !e.shiftKey && e.key.toLowerCase() === "g") {
      e.preventDefault();
      setJumpDialogOpen(true);
      setTimeout(() => jumpInputRef.current?.focus(), 50);
      return;
    }

    if (start === end) {
      const openChars: Record<string, string> = { "{": "}", "[": "]", "(": ")", '"': '"' };

      if (e.key in openChars) {
        const nextChar = value[start];
        const closeChar = openChars[e.key];

        if (e.key === '"' && nextChar === '"') {
          e.preventDefault();
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          setCursorPos(start + 1);
          return;
        }

        e.preventDefault();
        const newValue = value.slice(0, start) + e.key + closeChar + value.slice(start);
        onChange(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
            setCursorPos(start + 1);
          }
        }, 0);
        return;
      }

      if (["}", "]", ")"].includes(e.key) && value[start] === e.key) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        setCursorPos(start + 1);
        return;
      }

      if (e.key === "Backspace" && start > 0 && start < value.length) {
        const prev = value[start - 1];
        const next = value[start];
        if (
          (prev === "{" && next === "}") ||
          (prev === "[" && next === "]") ||
          (prev === "(" && next === ")") ||
          (prev === '"' && next === '"')
        ) {
          e.preventDefault();
          const newValue = value.slice(0, start - 1) + value.slice(start + 1);
          onChange(newValue);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - 1;
              setCursorPos(start - 1);
            }
          }, 0);
          return;
        }
      }
    }
  }

  function handleJumpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetLine = parseInt(jumpLineInput.trim(), 10);
    if (isNaN(targetLine) || targetLine < 1 || targetLine > lineCount) {
      setJumpDialogOpen(false);
      return;
    }

    const lines = value.split("\n");
    let charOffset = 0;
    for (let i = 0; i < targetLine - 1; i++) {
      charOffset += lines[i].length + 1;
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = charOffset;
      const lineHeightPx = 24;
      const targetScroll = (targetLine - 1) * lineHeightPx;
      textareaRef.current.scrollTop = targetScroll;
      if (preRef.current) preRef.current.scrollTop = targetScroll;
      if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = targetScroll;
      setCursorPos(charOffset);
    }
    setJumpDialogOpen(false);
    setJumpLineInput("");
  }

  return (
    <div
      className="relative flex h-full w-full overflow-hidden font-mono text-xs"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.fg }}
    >
      {jumpDialogOpen && (
        <form
          onSubmit={handleJumpSubmit}
          className="absolute right-4 top-2 z-30 flex items-center gap-2 rounded-lg p-2 shadow-2xl transition-all"
          style={{
            backgroundColor: theme.colors.panel,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <span className="font-mono text-xs" style={{ color: theme.colors.muted }}>
            Go to Line (1–{lineCount}):
          </span>
          <input
            ref={jumpInputRef}
            type="number"
            min={1}
            max={lineCount}
            value={jumpLineInput}
            onChange={(e) => setJumpLineInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setJumpDialogOpen(false);
                textareaRef.current?.focus();
              }
            }}
            placeholder="Line #"
            className="w-20 rounded border bg-transparent px-2 py-0.5 font-mono text-xs outline-none"
            style={{ borderColor: theme.colors.border, color: theme.colors.fg }}
          />
          <button
            type="submit"
            className="rounded px-2.5 py-0.5 font-mono text-xs font-semibold"
            style={{ backgroundColor: theme.colors.accent, color: "#fff" }}
          >
            Go
          </button>
          <button
            type="button"
            onClick={() => {
              setJumpDialogOpen(false);
              textareaRef.current?.focus();
            }}
            className="px-1.5 py-0.5 font-mono text-xs opacity-60 hover:opacity-100"
            style={{ color: theme.colors.muted }}
          >
            ✕
          </button>
        </form>
      )}

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

      <div className="relative flex-1 h-full overflow-hidden">
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

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onSelect={handleSelect}
          onClick={handleSelect}
          onKeyUp={handleSelect}
          onKeyDown={handleKeyDown}
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
