import type { Metadata } from "next";
import { JsonlPageClient } from "./client";

export const metadata: Metadata = {
  title: "JSONL / NDJSON Viewer — Parse, Validate & Filter JSON Lines | Devure JSON",
  description:
    "Free online JSON Lines (JSONL / NDJSON) viewer & validator. Validate line-by-line, filter valid/invalid records, search, and export. 100% privacy-first.",
  openGraph: {
    title: "JSONL / NDJSON Viewer | Devure JSON",
    description: "Inspect and validate large JSON Lines files directly in your browser.",
  },
  alternates: { canonical: "/jsonl-viewer" },
};

export default function JsonlPage() {
  return <JsonlPageClient />;
}
