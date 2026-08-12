"use client";

import { useEffect, useMemo, useState } from "react";
import {
  validateJsonSchema,
  inferSchemaFromJson,
  type SchemaValidationResult,
  type SchemaDraft,
} from "@/lib/schema-validator";
import { listSavedSchemas, saveSchema, deleteSchema, type SavedSchema } from "@/lib/saved-schemas";
import { decodeShareFragment } from "@/lib/share";
import { track } from "@/lib/analytics";
import { useTheme } from "@/hooks/useTheme";
import { ToolShell } from "./ToolShell";
import { ToolIntro } from "./ToolIntro";
import { JsonEditorArea } from "./JsonEditorArea";
import { useDialog } from "./DialogProvider";

const SAMPLE_SCHEMAS = [
  {
    name: "User Profile Schema",
    schema: JSON.stringify(
      {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        required: ["id", "username", "email", "role"],
        properties: {
          id: { type: "integer", minimum: 1 },
          username: { type: "string", minLength: 3 },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "developer", "viewer"] },
          skills: { type: "array", items: { type: "string" } },
        },
      },
      null,
      2
    ),
    data: JSON.stringify(
      {
        id: 42,
        username: "dev_user",
        email: "dev@example.com",
        role: "developer",
        skills: ["TypeScript", "Next.js", "JSON Schema"],
      },
      null,
      2
    ),
  },
  {
    name: "Product Catalog Schema",
    schema: JSON.stringify(
      {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        required: ["sku", "name", "price", "inStock"],
        properties: {
          sku: { type: "string", pattern: "^[A-Z]{3}-\\d{4}$" },
          name: { type: "string" },
          price: { type: "number", minimum: 0 },
          inStock: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      null,
      2
    ),
    data: JSON.stringify(
      { sku: "PRD-1024", name: "Developer Keyboard", price: 149.99, inStock: true, tags: ["hardware", "peripheral"] },
      null,
      2
    ),
  },
  {
    name: "2020-12 draft (prefixItems + const)",
    schema: JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["kind", "coords"],
        properties: {
          kind: { const: "point" },
          coords: { type: "array", prefixItems: [{ type: "number" }, { type: "number" }], minItems: 2, maxItems: 2 },
        },
      },
      null,
      2
    ),
    data: JSON.stringify({ kind: "point", coords: [12.5, -3.25] }, null, 2),
  },
];

const DRAFT_OPTIONS: { value: SchemaDraft; label: string }[] = [
  { value: "auto", label: "Auto-detect (from $schema)" },
  { value: "draft-07", label: "Draft-07" },
  { value: "2019-09", label: "2019-09" },
  { value: "2020-12", label: "2020-12" },
];

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SchemaValidatorPlayground() {
  const [dataText, setDataText] = useState("");
  const [schemaText, setSchemaText] = useState("");
  const [draftVersion, setDraftVersion] = useState<SchemaDraft>("auto");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loadedFromViewer, setLoadedFromViewer] = useState(false);

  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([]);
  const [regexOpen, setRegexOpen] = useState(false);
  const [regexPattern, setRegexPattern] = useState("");
  const [regexFlags, setRegexFlags] = useState("g");
  const [regexTestString, setRegexTestString] = useState("");

  const { theme } = useTheme();
  const dialog = useDialog();

  // Cross-tool handoff: the main viewer's "Validate against Schema…" command
  // encodes the current document into the URL hash (no `z=` prefix — same
  // scheme the JSONPath and converter pages already use for this).
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    let active = true;
    decodeShareFragment(hash)
      .then((decoded) => {
        if (active && decoded) {
          setDataText(decoded);
          setLoadedFromViewer(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Deferred via microtask — see the matching comment in
    // JsonPathPlayground for why this can't be a synchronous lazy-init.
    queueMicrotask(() => setSavedSchemas(listSavedSchemas()));
  }, []);

  const debouncedData = useDebounced(dataText, 250);
  const debouncedSchema = useDebounced(schemaText, 250);

  const result: SchemaValidationResult | null = useMemo(() => {
    if (!debouncedData.trim() && !debouncedSchema.trim()) return null;
    return validateJsonSchema(debouncedData, debouncedSchema, draftVersion);
  }, [debouncedData, debouncedSchema, draftVersion]);

  // Debounced already (see useDebounced above), so this fires once per
  // settled validation run rather than on every keystroke.
  useEffect(() => {
    if (!result) return;
    track("schema_validated", {
      draft: result.draftUsed ?? draftVersion,
      valid: result.valid,
      error_count: result.errors.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  useEffect(() => {
    if (regexOpen) track("feature_used", { feature: "regex_tester" });
  }, [regexOpen]);

  const isPending = dataText !== debouncedData || schemaText !== debouncedSchema;

  const regexResult = useMemo(() => {
    if (!regexPattern) return null;
    try {
      const re = new RegExp(regexPattern, regexFlags);
      if (regexFlags.includes("g")) {
        const matches = Array.from(regexTestString.matchAll(re));
        return { error: null, isMatch: matches.length > 0, matches };
      }
      const m = re.exec(regexTestString);
      return { error: null, isMatch: m !== null, matches: m ? [m] : [] };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err), isMatch: false, matches: [] };
    }
  }, [regexPattern, regexFlags, regexTestString]);

  const handleLoadSample = (index: number) => {
    const sample = SAMPLE_SCHEMAS[index];
    if (sample) {
      setDataText(sample.data);
      setSchemaText(sample.schema);
      setLoadedFromViewer(false);
    }
  };

  const handleInferSchema = () => {
    track("feature_used", { feature: "infer_schema" });
    const { schema, error } = inferSchemaFromJson(dataText);
    if (schema) setSchemaText(JSON.stringify(schema, null, 2));
    else if (error) setSchemaText(`// Could not infer a schema: ${error}`);
  };

  const handleSaveSchema = async () => {
    const name = await dialog.prompt({
      title: "Save schema",
      message: "Name this schema so you can find it again later.",
      defaultValue: "My schema",
      placeholder: "e.g. User Profile Schema",
      confirmLabel: "Save",
    });
    if (name === null) return;
    track("feature_used", { feature: "save_schema" });
    saveSchema(name, schemaText);
    setSavedSchemas(listSavedSchemas());
  };

  const handleLoadSaved = (id: string) => {
    const entry = savedSchemas.find((s) => s.id === id);
    if (entry) {
      track("feature_used", { feature: "load_saved_schema" });
      setSchemaText(entry.schemaText);
    }
  };

  const handleDeleteSaved = async (id: string, name: string) => {
    const ok = await dialog.confirm({
      title: "Delete saved schema",
      message: `Delete "${name}"? This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    deleteSchema(id);
    setSavedSchemas(listSavedSchemas());
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const presetSlot = loadedFromViewer ? (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono"
      style={{ backgroundColor: theme.colors.active, color: theme.colors.accent, border: `1px solid ${theme.colors.border}` }}
    >
      ✓ loaded from viewer
    </span>
  ) : undefined;

  const isEmpty = !dataText.trim() && !schemaText.trim();

  return (
    <ToolShell
      title="Schema Validator"
      activeHref="/json-schema-validator"
      presetSlot={presetSlot}
      commands={[
        { id: "infer-schema", label: "Infer schema from JSON data" },
        { id: "save-schema", label: "Save current schema…" },
        { id: "toggle-regex", label: "Toggle regex tester" },
        ...SAMPLE_SCHEMAS.map((s, i) => ({ id: `sample-${i}`, label: `Load sample: ${s.name}` })),
      ]}
      onSelectCommand={(id) => {
        if (id === "infer-schema") handleInferSchema();
        else if (id === "save-schema") handleSaveSchema();
        else if (id === "toggle-regex") setRegexOpen((v) => !v);
        else if (id.startsWith("sample-")) handleLoadSample(Number(id.slice(7)));
      }}
    >
      <div className="flex h-full flex-col">
        <ToolIntro heading="JSON Schema Validator" active={!isEmpty}>
          Validate JSON against a JSON Schema — Draft-07, 2019-09, or 2020-12, auto-detected from
          your schema&apos;s <span className="font-mono">$schema</span> field. Paste data and a
          schema (or infer one from sample JSON with one click) and get every error explained in
          plain language with the exact path to the failing field, not a raw Ajv dump. Save
          schemas you use often, and there&apos;s a built-in regex tester for pattern fields. All
          validation runs in your browser — nothing is ever uploaded.
        </ToolIntro>
        {/* Toolbar: draft selector, infer, save/load schema, regex tester */}
        <div
          className="flex flex-wrap items-center gap-2 border-b px-3 py-1.5 text-xs"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.panel }}
        >
          <label className="flex items-center gap-1.5" style={{ color: theme.colors.muted }}>
            Draft:
            <select
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value as SchemaDraft)}
              className="rounded border bg-transparent px-1.5 py-0.5 text-xs outline-none"
              style={{ borderColor: theme.colors.border, color: theme.colors.fg, backgroundColor: theme.colors.bg }}
            >
              {DRAFT_OPTIONS.map((d) => (
                <option key={d.value} value={d.value} style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          {result?.draftUsed && (
            <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ backgroundColor: theme.colors.hover, color: theme.colors.muted }}>
              compiled as {result.draftUsed}
            </span>
          )}

          <span className="opacity-30">|</span>

          <button
            onClick={handleInferSchema}
            disabled={!dataText.trim()}
            className="rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
            title="Generate a JSON Schema from the pasted JSON data"
          >
            ✨ Infer schema from JSON
          </button>

          <button
            onClick={handleSaveSchema}
            disabled={!schemaText.trim()}
            className="rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
          >
            💾 Save schema
          </button>

          {savedSchemas.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) handleLoadSaved(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="rounded border bg-transparent px-1.5 py-0.5 text-xs outline-none"
              style={{ borderColor: theme.colors.border, color: theme.colors.fg, backgroundColor: theme.colors.bg }}
              aria-label="Load a saved schema"
            >
              <option value="" disabled style={{ backgroundColor: theme.colors.panel }}>
                Load saved… ({savedSchemas.length})
              </option>
              {savedSchemas.map((s) => (
                <option key={s.id} value={s.id} style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {schemaText.trim() && (
            <button
              onClick={() => downloadText("schema.json", schemaText)}
              className="rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: theme.colors.hover, color: theme.colors.fg }}
            >
              ⬇ Export
            </button>
          )}

          <span className="opacity-30">|</span>

          <button
            onClick={() => setRegexOpen((v) => !v)}
            className="rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: regexOpen ? theme.colors.active : theme.colors.hover,
              color: regexOpen ? theme.colors.accent : theme.colors.fg,
            }}
            aria-pressed={regexOpen}
          >
            🔤 Regex tester
          </button>

          <span className="opacity-30 hidden sm:inline">|</span>

          <span className="hidden sm:inline" style={{ color: theme.colors.muted }}>
            Preset:
          </span>
          <select
            onChange={(e) => e.target.value && handleLoadSample(Number(e.target.value))}
            defaultValue=""
            className="hidden rounded border bg-transparent px-1.5 py-0.5 text-xs outline-none sm:inline-block"
            style={{ borderColor: theme.colors.border, color: theme.colors.fg, backgroundColor: theme.colors.bg }}
          >
            <option value="" disabled style={{ backgroundColor: theme.colors.panel }}>
              Load sample…
            </option>
            {SAMPLE_SCHEMAS.map((s, idx) => (
              <option key={idx} value={idx} style={{ backgroundColor: theme.colors.panel, color: theme.colors.fg }}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Regex tester drawer */}
        {regexOpen && (
          <div className="border-b px-3 py-2 text-xs" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg }}>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="regex-pattern-input" className="font-semibold" style={{ color: theme.colors.muted }}>
                Pattern:
              </label>
              <span style={{ color: theme.colors.muted }}>/</span>
              <input
                id="regex-pattern-input"
                type="text"
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                placeholder="^[A-Z]{3}-\\d{4}$"
                className="min-w-[220px] flex-1 rounded border bg-transparent px-2 py-1 font-mono text-xs outline-none"
                style={{ borderColor: theme.colors.border, color: theme.colors.fg }}
                spellCheck={false}
              />
              <span style={{ color: theme.colors.muted }}>/</span>
              <input
                type="text"
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value.replace(/[^dgimsuvy]/g, ""))}
                placeholder="g"
                aria-label="Regex flags"
                className="w-14 rounded border bg-transparent px-2 py-1 font-mono text-xs outline-none"
                style={{ borderColor: theme.colors.border, color: theme.colors.fg }}
              />
            </div>
            <label htmlFor="regex-test-string" className="mt-2 mb-1 block font-semibold" style={{ color: theme.colors.muted }}>
              Test string:
            </label>
            <textarea
              id="regex-test-string"
              value={regexTestString}
              onChange={(e) => setRegexTestString(e.target.value)}
              placeholder="Paste one or more candidate values, one per line…"
              rows={3}
              className="w-full rounded border bg-transparent p-2 font-mono text-xs outline-none resize-y"
              style={{ borderColor: theme.colors.border, color: theme.colors.fg }}
              spellCheck={false}
            />
            {regexResult?.error && (
              <p className="mt-1.5 font-mono text-[11px] text-red-400">Invalid pattern: {regexResult.error}</p>
            )}
            {regexResult && !regexResult.error && (
              <p className="mt-1.5 font-mono text-[11px]" style={{ color: regexResult.isMatch ? "#10b981" : theme.colors.muted }}>
                {regexResult.isMatch ? `✓ ${regexResult.matches.length} match(es)` : "✕ no match"}
                {regexResult.matches.slice(0, 5).map((m, i) => (
                  <span key={i} className="ml-2 opacity-80">
                    {`[${m.index}] "${m[0]}"`}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        {/* Main Content Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-hidden">
          {/* Left Inputs (Data & Schema) - 7 Columns */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r min-h-0" style={{ borderColor: theme.colors.border }}>
            <div className="flex-1 flex flex-col min-h-0 border-b" style={{ borderColor: theme.colors.border }}>
              <div
                className="flex items-center justify-between px-3 py-1.5 text-xs font-medium border-b"
                style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.muted }}
              >
                <label htmlFor="schema-data-editor" className="cursor-default">
                  Target JSON Data
                </label>
                <span className="text-[10px] font-mono opacity-60">{dataText.length.toLocaleString()} chars</span>
              </div>
              <div className="flex-1 min-h-0">
                <JsonEditorArea
                  value={dataText}
                  onChange={setDataText}
                  theme={theme}
                  ariaLabel="Target JSON data to validate"
                  placeholder="Paste JSON data to validate…"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div
                className="flex items-center justify-between px-3 py-1.5 text-xs font-medium border-b"
                style={{ backgroundColor: theme.colors.panel, borderColor: theme.colors.border, color: theme.colors.muted }}
              >
                <label htmlFor="schema-editor" className="cursor-default">
                  JSON Schema ($schema)
                </label>
                <span className="text-[10px] font-mono opacity-60">{schemaText.length.toLocaleString()} chars</span>
              </div>
              <div className="flex-1 min-h-0">
                <JsonEditorArea
                  value={schemaText}
                  onChange={setSchemaText}
                  theme={theme}
                  ariaLabel="JSON Schema definition"
                  placeholder="Paste a JSON Schema object, or click ✨ Infer schema from JSON…"
                />
              </div>
            </div>
          </div>

          {/* Right Output Results Panel - 5 Columns */}
          <div className="lg:col-span-5 flex flex-col min-h-0 overflow-y-auto" style={{ backgroundColor: theme.colors.panel }} aria-live="polite">
            {isEmpty ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3" style={{ color: theme.colors.muted }}>
                <div className="text-2xl">🧬</div>
                <p className="text-xs max-w-xs">
                  Paste JSON data and a schema on the left, or load a sample to see validation in action.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SAMPLE_SCHEMAS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadSample(idx)}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-mono transition-all hover:scale-105"
                      style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg, color: theme.colors.fg }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
                  {isPending ? (
                    <div className="p-3 rounded-lg border text-xs" style={{ borderColor: theme.colors.border, color: theme.colors.muted }}>
                      Validating…
                    </div>
                  ) : result?.parseError ? (
                    <div
                      className="p-3 rounded-lg border text-xs"
                      style={{ backgroundColor: "rgba(217, 119, 6, 0.15)", borderColor: "rgba(217, 119, 6, 0.3)", color: "#f59e0b" }}
                    >
                      <div className="font-semibold mb-1 flex items-center gap-1.5">
                        <span>⚠️</span> Syntax / Parse Issue
                      </div>
                      <div className="font-mono text-[11px]">{result.parseError}</div>
                    </div>
                  ) : result?.valid ? (
                    <div
                      className="p-3.5 rounded-lg border text-xs flex items-center justify-between"
                      style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">✓</span>
                        <div>
                          <div className="font-bold text-sm">Valid JSON Schema</div>
                          <div className="text-[11px] opacity-80">Target JSON strictly satisfies all defined schema constraints.</div>
                        </div>
                      </div>
                    </div>
                  ) : result ? (
                    <div
                      className="p-3.5 rounded-lg border text-xs"
                      style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">✕</span>
                        <div className="font-bold text-sm">
                          Invalid JSON ({result.errors.length} error{result.errors.length === 1 ? "" : "s"})
                        </div>
                      </div>
                      <div className="text-[11px] opacity-80">Target data violates constraints in the schema.</div>
                    </div>
                  ) : null}
                </div>

                {result && !result.parseError && !result.valid && (
                  <div className="p-4 flex-1 space-y-3 min-h-0 overflow-y-auto">
                    <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70" style={{ color: theme.colors.muted }}>
                      Schema Validation Errors
                    </h3>
                    <div className="space-y-2">
                      {result.errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-md border text-xs font-mono transition-colors"
                          style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border, color: theme.colors.fg }}
                        >
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span
                              className="font-semibold px-1.5 py-0.5 rounded text-[11px] truncate"
                              style={{ backgroundColor: theme.colors.active, color: theme.colors.accent, border: `1px solid ${theme.colors.border}` }}
                            >
                              {err.path}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {err.keyword === "pattern" && typeof err.params?.pattern === "string" && (
                                <button
                                  onClick={() => {
                                    setRegexOpen(true);
                                    setRegexPattern(String(err.params?.pattern ?? ""));
                                    setRegexFlags("g");
                                  }}
                                  className="text-[10px] hover:underline transition-colors"
                                  style={{ color: theme.colors.accent }}
                                >
                                  Test pattern
                                </button>
                              )}
                              <button
                                onClick={() => copyToClipboard(err.path, idx)}
                                className="text-[10px] hover:underline transition-colors"
                                style={{ color: theme.colors.muted }}
                              >
                                {copiedIndex === idx ? "Copied!" : "Copy Path"}
                              </button>
                            </div>
                          </div>
                          <div className="font-sans font-medium text-xs mb-1" style={{ color: theme.colors.fg }}>
                            {err.message}
                          </div>
                          <div className="text-[10px] truncate opacity-60" style={{ color: theme.colors.muted }}>
                            Keyword: <code>{err.keyword}</code> | Schema: <code>{err.schemaPath}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result?.valid && !result.parseError && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ color: theme.colors.muted }}>
                    <div
                      className="w-12 h-12 rounded-full border flex items-center justify-center text-xl mb-3"
                      style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}
                    >
                      ✓
                    </div>
                    <p className="text-xs max-w-xs opacity-80">No schema validation errors found. Modify the JSON or schema on the left to test edge cases.</p>
                  </div>
                )}

                {savedSchemas.length > 0 && (
                  <div className="border-t p-3" style={{ borderColor: theme.colors.border }}>
                    <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-70" style={{ color: theme.colors.muted }}>
                      Saved schemas
                    </h3>
                    <ul className="space-y-1">
                      {savedSchemas.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 text-xs font-mono">
                          <button onClick={() => handleLoadSaved(s.id)} className="truncate hover:underline text-left" style={{ color: theme.colors.fg }}>
                            {s.name}
                          </button>
                          <button
                            onClick={() => handleDeleteSaved(s.id, s.name)}
                            className="shrink-0 text-[10px] opacity-60 hover:opacity-100"
                            style={{ color: theme.colors.muted }}
                            aria-label={`Delete saved schema ${s.name}`}
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
