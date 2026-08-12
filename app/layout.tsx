import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Set NEXT_PUBLIC_SITE_URL in production once there's a real domain — this
// only falls back to localhost so metadata/canonical URLs are well-formed
// in dev, not a placeholder pretending to be a real site.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JSON Viewer — Paste, Diff, and Inspect JSON in Your Browser",
    template: "%s | JSON Viewer",
  },
  description:
    "A fast, keyboard-first JSON viewer that runs entirely in your browser. Paste JSON to inspect it, compare two documents, or open large files without freezing the tab. Nothing you paste ever leaves your browser.",
  openGraph: {
    type: "website",
    siteName: "JSON Viewer",
    title: "JSON Viewer — Paste, Diff, and Inspect JSON in Your Browser",
    description:
      "A fast, keyboard-first JSON viewer that runs entirely in your browser. Nothing you paste ever leaves your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JSON Viewer — Paste, Diff, and Inspect JSON in Your Browser",
    description:
      "A fast, keyboard-first JSON viewer that runs entirely in your browser. Nothing you paste ever leaves your browser.",
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
