import { ApiResponsePlayground } from "@/components/ApiResponsePlayground";
import { ThemeProvider } from "@/hooks/useTheme";

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

export default function ApiResponsePage() {
  return (
    <ThemeProvider>
      <ApiResponsePlayground />
    </ThemeProvider>
  );
}
