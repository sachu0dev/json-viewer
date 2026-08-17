import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { SCHEMA_AUTHOR } from "@/lib/site";

const TITLE = "JSON Diff Checker — Compare Two JSON Files Online";
const DESCRIPTION =
  "Compare two JSON documents and see exactly what was added, removed, or changed — a real structural diff, not a text diff. Free JSON diff checker, runs entirely in your browser, nothing is uploaded.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/json-diff" },
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JSON Diff Tool",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description: DESCRIPTION,
};

export default function JsonDiffPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolPage heading="Compare two JSON files" diffMode>
        Paste your first JSON below — you&apos;ll be prompted for the second one right after. You
        get a real structural diff — added, removed, and changed fields — not a line-by-line text
        diff. Nothing you paste ever leaves your browser.
      </ToolPage>
    </>
  );
}
