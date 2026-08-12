import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";

const TITLE = "JSON Diff Tool — Compare Two JSON Files Online";
const DESCRIPTION =
  "Compare two JSON documents and see exactly what was added, removed, or changed — a real structural diff, not a text diff. Runs entirely in your browser, nothing is uploaded.";

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
  description: DESCRIPTION,
};

export default function JsonDiffPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolPage heading="Compare two JSON files">
        Paste your first JSON below, then use <span className="font-mono">Compare…</span> to
        paste the second. You get a real structural diff — added, removed, and changed fields —
        not a line-by-line text diff. Nothing you paste ever leaves your browser.
      </ToolPage>
    </>
  );
}
