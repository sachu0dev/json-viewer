"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

export interface PromptOptions {
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red) instead of the accent color. */
  danger?: boolean;
}

type DialogState =
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void }
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | null;

interface DialogContextValue {
  /** Replaces window.prompt — resolves the typed value, or null if cancelled. */
  prompt: (options: PromptOptions | string) => Promise<string | null>;
  /** Replaces window.confirm — resolves true/false. */
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * App-wide themed replacement for window.prompt/confirm. Mounted once inside
 * ThemeProvider (hooks/useTheme.tsx) so every page that already wraps itself
 * in <ThemeProvider> gets this for free — call useDialog() from anywhere
 * under it instead of reaching for the native browser dialogs, which can't
 * be styled and look jarring next to the rest of the app.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const [inputValue, setInputValue] = useState("");

  const prompt = useCallback((options: PromptOptions | string): Promise<string | null> => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise((resolve) => {
      setInputValue(opts.defaultValue ?? "");
      setState({ kind: "prompt", options: opts, resolve });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise((resolve) => {
      setState({ kind: "confirm", options: opts, resolve });
    });
  }, []);

  const resolveAndClose = useCallback(
    (result: string | boolean | null) => {
      if (!state) return;
      if (state.kind === "prompt") state.resolve(result as string | null);
      else state.resolve(Boolean(result));
      setState(null);
    },
    [state]
  );

  return (
    <DialogContext.Provider value={{ prompt, confirm }}>
      {children}
      {state && (
        <DialogModal
          state={state}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onConfirm={() => resolveAndClose(state.kind === "prompt" ? inputValue : true)}
          onCancel={() => resolveAndClose(state.kind === "prompt" ? null : false)}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog() must be called within a DialogProvider (mounted inside ThemeProvider)");
  }
  return ctx;
}

function DialogModal({
  state,
  inputValue,
  onInputChange,
  onConfirm,
  onCancel,
}: {
  state: Exclude<DialogState, null>;
  inputValue: string;
  onInputChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const isPrompt = state.kind === "prompt";
  const { message, title } = state.options;
  const confirmLabel = state.options.confirmLabel ?? (isPrompt ? "Save" : "Confirm");
  const cancelLabel = state.options.cancelLabel ?? "Cancel";
  const danger = !isPrompt && state.options.danger;

  useEffect(() => {
    (isPrompt ? inputRef.current : confirmBtnRef.current)?.focus();
    if (isPrompt) inputRef.current?.select();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (!isPrompt && e.key === "Tab") {
        // Only two focusable buttons — keep tab cycling inside the dialog.
        e.preventDefault();
        (document.activeElement === confirmBtnRef.current ? dialogRef.current?.querySelector("button") : confirmBtnRef.current)?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrompt]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? (isPrompt ? "Input required" : "Confirm action")}
        className="w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.fg }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm();
          }}
        >
          <div className="p-5">
            {title && <h2 className="mb-1.5 text-sm font-semibold">{title}</h2>}
            <p className="text-xs" style={{ color: theme.colors.muted }}>
              {message}
            </p>
            {isPrompt && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={state.options.placeholder}
                className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.fg }}
              />
            )}
          </div>
          <div
            className="flex items-center justify-end gap-2 border-t px-5 py-3"
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg, border: `1px solid ${theme.colors.border}` }}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmBtnRef}
              type="submit"
              className="rounded px-4 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
              style={{ backgroundColor: danger ? "#ef4444" : theme.colors.accent, color: "#ffffff" }}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
