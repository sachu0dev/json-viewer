"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiffEntry, ParseError, Row, SideBySideDiffRow } from "@/lib/json-document";
import type { ParseMode } from "@/lib/json-parser";
import type { WorkerRequest, WorkerResponse } from "@/workers/json.worker";

export function useJsonDocument() {
  const workerRef = useRef<Worker | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<ParseError | null>(null);
  const [parseMode, setParseMode] = useState<ParseMode>("strict");
  const [stringParseError, setStringParseError] = useState<ParseError | null>(null);
  const [jsEvalStatus, setJsEvalStatus] = useState<"success" | "fails">("success");

  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<string[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const [revealTarget, setRevealTarget] = useState<string | null>(null);

  const [diffEntries, setDiffEntries] = useState<DiffEntry[] | null>(null);
  const [sideBySideRows, setSideBySideRows] = useState<SideBySideDiffRow[] | null>(null);
  const [compareError, setCompareError] = useState<ParseError | null>(null);
  const stringifyResolverRef = useRef<((text: string) => void) | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/json.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === "parsed") {
        setIsLoading(false);
        setRows(data.rows);
        setError(null);
        setParseMode(data.mode);
        setStringParseError(data.stringError);
        setJsEvalStatus(data.jsEvalStatus);
      } else if (data.type === "error") {
        setIsLoading(false);
        setRows(null);
        setError(data.error);
        setParseMode("error");
        setStringParseError(data.error);
        setJsEvalStatus(data.jsEvalStatus);
      } else if (data.type === "search-results") {
        setMatches(data.paths);
        setActiveMatchIndex(data.paths.length > 0 ? 0 : -1);
        if (data.paths.length > 0) {
          setRevealTarget(data.paths[0]);
          worker.postMessage({ type: "reveal", path: data.paths[0] } satisfies WorkerRequest);
        }
      } else if (data.type === "diff") {
        setDiffEntries(data.entries);
        setSideBySideRows(data.sideBySideRows);
        setCompareError(null);
      } else if (data.type === "compare-error") {
        setDiffEntries(null);
        setSideBySideRows(null);
        setCompareError(data.error);
      } else if (data.type === "stringified") {
        stringifyResolverRef.current?.(data.text);
        stringifyResolverRef.current = null;
      }
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const send = useCallback((message: WorkerRequest) => {
    workerRef.current?.postMessage(message);
  }, []);

  const loadText = useCallback(
    (text: string) => {
      setIsLoading(true);
      setMatches([]);
      setActiveMatchIndex(-1);
      setRevealTarget(null);
      setDiffEntries(null);
      setSideBySideRows(null);
      setCompareError(null);
      send({ type: "parse", text });
    },
    [send],
  );

  const toggle = useCallback((path: string) => send({ type: "toggle", path }), [send]);

  // Debounced search (150ms delay) to prevent UI lag on rapid typing
  const search = useCallback(
    (query: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        send({ type: "search", query });
      }, 150);
    },
    [send],
  );

  const goToMatch = useCallback(
    (delta: number) => {
      if (matches.length === 0) return;
      const next = (activeMatchIndex + delta + matches.length) % matches.length;
      setActiveMatchIndex(next);
      setRevealTarget(matches[next]);
      send({ type: "reveal", path: matches[next] });
    },
    [matches, activeMatchIndex, send],
  );

  const compare = useCallback((text: string) => send({ type: "compare", text }), [send]);

  const clearCompare = useCallback(() => {
    setDiffEntries(null);
    setSideBySideRows(null);
    setCompareError(null);
    send({ type: "clear-compare" });
  }, [send]);

  const stringify = useCallback(
    (mode: "pretty" | "compact") =>
      new Promise<string>((resolve) => {
        stringifyResolverRef.current = resolve;
        send({ type: "stringify", mode });
      }),
    [send],
  );

  return {
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
    diffEntries,
    sideBySideRows,
    compareError,
    compare,
    clearCompare,
    stringify,
  };
}
