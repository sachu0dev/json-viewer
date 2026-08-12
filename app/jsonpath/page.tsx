import type { Metadata } from "next";
import { JsonPathPageClient } from "./client";

export const metadata: Metadata = {
  title: "JSONPath Tester — Query JSON with JSONPath | Devure JSON",
  description:
    "Run JSONPath expressions against your JSON. See matching paths, values, and execution time. Free, privacy-first — no data leaves your browser.",
  openGraph: {
    title: "JSONPath Tester | Devure JSON",
    description: "Interactive JSONPath playground — query JSON in your browser.",
  },
  alternates: { canonical: "/jsonpath" },
};

export default function JsonPathPage() {
  return <JsonPathPageClient />;
}
