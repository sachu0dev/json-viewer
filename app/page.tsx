import { ToolPage } from "@/components/ToolPage";
import { SCHEMA_AUTHOR } from "@/lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JSON Viewer",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description:
    "A free online JSON viewer, formatter, and parser: paste JSON to instantly format, validate, and explore it, compare two documents, or open large files without freezing the tab.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolPage heading="Free JSON Viewer, Formatter & Parser">
        Paste JSON to instantly format, validate, and explore it — with syntax highlighting,
        search, and a collapsible tree view. Compare two JSON documents or open large multi-MB
        files without freezing your browser. Nothing you paste ever leaves your device.
      </ToolPage>
    </>
  );
}
