import type { Metadata } from "next";
import { JsonlPageClient } from "./client";
import { SCHEMA_AUTHOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "JSONL / NDJSON Viewer — Parse, Validate & Filter JSON Lines",
  description:
    "Free online JSON Lines (JSONL / NDJSON) viewer & validator. Validate line-by-line, filter valid/invalid records, search, and export. 100% privacy-first.",
  openGraph: {
    title: "JSONL / NDJSON Viewer | Devure JSON",
    description: "Inspect and validate large JSON Lines files directly in your browser.",
  },
  alternates: { canonical: "/jsonl-viewer" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JSONL / NDJSON Viewer",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description:
    "Free online JSON Lines (JSONL / NDJSON) viewer & validator. Validate line-by-line, filter valid/invalid records, search, and export. 100% privacy-first.",
};

export default function JsonlPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <JsonlPageClient />
    </>
  );
}
