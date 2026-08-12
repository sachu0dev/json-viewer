import { ToolPage } from "@/components/ToolPage";
import { HomepageSeoContent } from "@/components/HomepageSeoContent";
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
  featureList: [
    "JSON viewer, formatter & parser",
    "JSONPath query playground",
    "Side-by-side JSON diff",
    "JSON Schema validator (Draft-07 / 2019-09 / 2020-12)",
    "JWT decoder",
    "API response inspector",
    "Large-file support via Web Worker + virtualized tree",
    "JSON to TypeScript, Python, Go, Rust, Java, C#, Swift, JavaScript",
    "JSON to CSV, YAML, XML, TOML, SQL",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ToolPage
        heading="All-in-One Privacy-First Developer Workspace"
        seoContent={<HomepageSeoContent />}
      >
        Explore, format, and edit JSON with interactive Tree and Split views. Query with JSONPath, compare side-by-side diffs, auto-repair syntax errors, minify, process JSONL streams, and convert JSON to TypeScript, Python, Go, Rust, Java, C#, Swift, CSV, YAML, XML & SQL. 100% local-first — your data never leaves your browser.
      </ToolPage>
    </>
  );
}
