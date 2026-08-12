import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { SCHEMA_AUTHOR } from "@/lib/site";

const TITLE = "View Large JSON Files Without Crashing Your Browser";
const DESCRIPTION =
  "Open large JSON payloads that choke other online formatters. Parsing runs off the main thread in a Web Worker, and the tree only renders what's visible, so multi-MB files stay responsive.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/large-files" },
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Large JSON File Viewer",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description: DESCRIPTION,
};

export default function LargeFilesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolPage heading="View large JSON files without freezing the tab">
        JSON is parsed in a background Web Worker, and only the rows currently on screen are
        rendered — so a large API response or export doesn&apos;t lock up the page the way a
        plain formatter does. Drop a file or paste to try it.
      </ToolPage>
    </>
  );
}
