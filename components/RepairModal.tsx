"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { SideBySideDiff } from "./SideBySideDiff";
import { buildSideBySideDiffRows } from "@/lib/json-document";
import { parseTolerantJSON } from "@/lib/json-parser";
import type { RepairResult } from "@/lib/json-repair";

interface Props {
  originalText: string;
  repairResult: RepairResult;
  onApprove: (repairedText: string) => void;
  onClose: () => void;
}

export function RepairModal({ originalText, repairResult, onApprove, onClose }: Props) {
  const { theme } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap & Escape key
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusables = el.querySelectorAll<HTMLElement>("button");
    focusables[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
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

  // Compute side-by-side diff rows for preview
  const originalParsed = parseTolerantJSON(originalText).value ?? {};
  const repairedParsed = repairResult.doc ?? {};
  const diffRows = buildSideBySideDiffRows(originalParsed, repairedParsed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Repair JSON Preview"
        className="flex h-150 w-full max-w-4xl flex-col overflow-hidden rounded-xl shadow-2xl"
        style={{
          backgroundColor: theme.colors.bg,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.fg,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
        >
          <div className="flex items-center gap-3">
            <span className="text-base">🔧</span>
            <div>
              <h2 className="text-sm font-semibold">Repair JSON Preview</h2>
              <p className="text-xs" style={{ color: theme.colors.muted }}>
                Review detected changes before applying. Data is never automatically modified.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close repair preview"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden p-4 gap-4">
          {/* Changes summary */}
          <div
            className="rounded-lg p-3 text-xs"
            style={{
              backgroundColor: `${theme.colors.accent}15`,
              border: `1px solid ${theme.colors.accent}40`,
            }}
          >
            <p className="font-semibold uppercase tracking-wider text-[11px] mb-1.5" style={{ color: theme.colors.accent }}>
              Detected Changes ({repairResult.changes.length})
            </p>
            {repairResult.changes.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {repairResult.changes.map((c) => (
                  <li key={c.id}>
                    <strong className="font-mono text-[11px]">{c.category}:</strong> {c.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: theme.colors.muted }}>No specific syntax patterns detected, applied structural cleanup.</p>
            )}
          </div>

          {/* Diff Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Before / After Preview</span>
              <span className="text-[11px] font-mono opacity-50">
                {repairResult.isValid ? "✓ Valid JSON result" : "⚠️ Partial cleanup"}
              </span>
            </div>
            <div
              className="flex-1 overflow-hidden rounded-lg border"
              style={{ borderColor: theme.colors.border }}
            >
              <SideBySideDiff rows={diffRows} />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between border-t px-5 py-3"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
        >
          <span className="text-xs" style={{ color: theme.colors.muted }}>
            Clicking Apply will replace the current editor content with the repaired JSON.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: theme.colors.hover,
                color: theme.colors.fg,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onApprove(repairResult.repairedText)}
              className="rounded px-4 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.colors.accent,
                color: "#ffffff",
              }}
            >
              Apply Repaired JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
