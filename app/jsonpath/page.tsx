import type { Metadata } from "next";
import { JsonPathPageClient } from "./client";
import { SCHEMA_AUTHOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "JSONPath Tester — Query JSON with JSONPath",
  description:
    "Run JSONPath expressions against your JSON. See matching paths, values, and execution time. Free, privacy-first — no data leaves your browser.",
  openGraph: {
    title: "JSONPath Tester | Devure JSON",
    description: "Interactive JSONPath playground — query JSON in your browser.",
  },
  alternates: { canonical: "/jsonpath" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JSONPath Tester",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description:
    "Run JSONPath expressions against your JSON. See matching paths, values, and execution time. Free, privacy-first — no data leaves your browser.",
};

export default function JsonPathPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <JsonPathPageClient />
    </>
  );
}
