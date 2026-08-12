import { SchemaValidatorPlayground } from "@/components/SchemaValidatorPlayground";
import { ThemeProvider } from "@/hooks/useTheme";
import { SCHEMA_AUTHOR } from "@/lib/site";

export const metadata = {
  title: "JSON Schema Validator — Free Online Client-Side Validation Tool",
  description:
    "Validate JSON data against JSON Schema (Draft 07, 2019-09, 2020-12) with instant human-readable error messages, zero server uploads, 100% private in-browser validation.",
  openGraph: {
    title: "JSON Schema Validator — Devure JSON",
    description:
      "Validate JSON objects against JSON Schema specifications with detailed error path trees. Pure client-side, local-first.",
  },
  alternates: { canonical: "/json-schema-validator" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JSON Schema Validator",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description:
    "Validate JSON data against JSON Schema (Draft 07, 2019-09, 2020-12) with instant human-readable error messages, zero server uploads, 100% private in-browser validation.",
};

export default function JsonSchemaValidatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ThemeProvider>
        <SchemaValidatorPlayground />
      </ThemeProvider>
    </>
  );
}
