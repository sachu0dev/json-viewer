import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { Providers } from "@/components/Providers";

const GA_MEASUREMENT_ID = "G-FSD6QCXQDR";

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Devure JSON",
  url: "https://json.devure.in/",
  publisher: {
    "@type": "Person",
    name: "Sushil Kumar",
    url: "https://devure.in",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JSON Viewer, Formatter & Parser — Free Online JSON Tool",
    template: "%s | JSON Viewer",
  },
  description:
    "A free online JSON viewer, formatter, and parser. Paste JSON to instantly format, validate, and explore it with syntax highlighting, compare two documents, or open large files without freezing the tab. Nothing you paste ever leaves your browser.",
  keywords: [
    "json viewer",
    "json formatter",
    "json parser",
    "json validator",
    "json beautifier",
    "online json editor",
    "json diff",
    "json compare",
  ],
  authors: [{ name: "Sushil Kumar", url: "https://devure.in" }],
  creator: "Sushil Kumar",
  openGraph: {
    type: "website",
    siteName: "JSON Viewer",
    title: "JSON Viewer, Formatter & Parser — Free Online JSON Tool",
    description:
      "Paste JSON to instantly format, validate, and explore it. Compare documents or open large files — nothing you paste ever leaves your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JSON Viewer, Formatter & Parser — Free Online JSON Tool",
    description:
      "Paste JSON to instantly format, validate, and explore it. Compare documents or open large files — nothing you paste ever leaves your browser.",
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
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />

        {/* Google Analytics. Client-side route changes are picked up by GA4's
            enhanced measurement (history-event trigger), so no manual
            page_view call is needed on navigation. The googletagmanager /
            google-analytics hosts are allowlisted in next.config.ts's CSP —
            without that, these requests are blocked outright. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
