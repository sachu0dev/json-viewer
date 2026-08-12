import { ViewerApp } from "@/components/ViewerApp";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JSON Viewer",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "A fast, keyboard-first JSON viewer that runs entirely in the browser: paste and inspect JSON, compare two documents, or open large files without freezing the tab.",
};

export default function Home() {
  return (
    <div className="h-dvh w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <h1 className="sr-only">JSON Viewer — Paste, Diff, and Inspect JSON in Your Browser</h1>
      <ViewerApp />
    </div>
  );
}
