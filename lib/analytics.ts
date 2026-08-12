// GA4 event tracking.
//
// PRIVACY RULE — do not break this: the app's headline promise is "nothing you
// paste ever leaves your browser", and these events are the one code path that
// talks to a third party. So every parameter here is *metadata about* the
// document (byte counts, node counts, enum labels), never the document itself.
// Never add a parameter carrying JSON content: no keys, no values, no paths,
// no error snippets (`ParseError.snippet` is literally a slice of the user's
// document — sending it would leak pasted data to Google and make the promise
// on the homepage a lie).

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}

/** How a document entered the app — the top of the activation funnel. */
export type LoadSource = "paste" | "drop" | "recent" | "share_link" | "edit";

/** Discrete features, for "what do activated users actually use?" */
export type Feature =
  | "format"
  | "search"
  | "copy_formatted"
  | "copy_minified"
  | "theme_change"
  | "view_toggle"
  | "command_palette"
  | "tree_expand";

type AnalyticsEvent =
  // Activation: a document was successfully parsed and rendered.
  | { name: "json_loaded"; params: { source: LoadSource; size_bytes: number; parse_mode: string; row_count: number } }
  // Friction: the user brought a document in and it did not parse. This is the
  // single most useful drop-off signal — it is the moment people give up.
  | { name: "json_parse_failed"; params: { source: LoadSource; size_bytes: number; error_line: number } }
  // Engagement depth.
  | { name: "document_edited"; params: { size_bytes: number } }
  | { name: "feature_used"; params: { feature: Feature } }
  // The sharing loop: created vs. opened tells you whether shares actually
  // bring people back, which is the main organic growth path for a tool like this.
  | { name: "share_link_created"; params: { size_bytes: number; fragment_chars: number } }
  | { name: "share_link_opened"; params: { fragment_chars: number } }
  // Compare funnel: started without completed = users who tried diffing and bailed.
  | { name: "compare_started"; params?: Record<string, never> }
  | { name: "compare_completed"; params: { changed_count: number } };

export function track<E extends AnalyticsEvent>(name: E["name"], params?: E["params"]): void {
  if (typeof window === "undefined") return;
  // Absent in dev without the tag, and when an ad blocker removes it. Silently
  // no-op rather than throwing inside a UI handler.
  window.gtag?.("event", name, params);
}
