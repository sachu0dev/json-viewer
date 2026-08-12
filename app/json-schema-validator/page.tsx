import { SchemaValidatorPlayground } from "@/components/SchemaValidatorPlayground";
import { ThemeProvider } from "@/hooks/useTheme";

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

export default function JsonSchemaValidatorPage() {
  return (
    <ThemeProvider>
      <SchemaValidatorPlayground />
    </ThemeProvider>
  );
}
