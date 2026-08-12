import { ApiResponsePlayground } from "@/components/ApiResponsePlayground";
import { ThemeProvider } from "@/hooks/useTheme";
import { SCHEMA_AUTHOR } from "@/lib/site";

export const metadata = {
  title: "API Response Inspector — Free Online HTTP Header & Body Parser",
  description:
    "Paste raw HTTP responses to inspect status codes, headers, and pretty-print JSON response bodies with zero server uploads.",
  openGraph: {
    title: "API Response Inspector — Devure JSON",
    description: "Inspect HTTP response headers and JSON payloads directly in your browser.",
  },
  alternates: { canonical: "/api-response" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "API Response Inspector",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description:
    "Paste raw HTTP responses to inspect status codes, headers, and pretty-print JSON response bodies with zero server uploads.",
};

export default function ApiResponsePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ThemeProvider>
        <ApiResponsePlayground />
      </ThemeProvider>
    </>
  );
}
