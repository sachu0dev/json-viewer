import { PrivacyPage } from "@/components/PrivacyPage";
import { ThemeProvider } from "@/hooks/useTheme";

export const metadata = {
  title: "Privacy & Local-First Architecture — JSON Viewer",
  description:
    "How Devure JSON keeps your data on your device: the browser → Web Worker → result pipeline, what's stored locally, and the exact analytics events recorded — no JSON content, ever.",
  openGraph: {
    title: "Privacy & Local-First Architecture — Devure JSON",
    description: "Your JSON never leaves your browser. Here's exactly how, and what analytics does and doesn't record.",
  },
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <ThemeProvider>
      <PrivacyPage />
    </ThemeProvider>
  );
}
