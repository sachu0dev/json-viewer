import { JwtDecoderPlayground } from "@/components/JwtDecoderPlayground";
import { ThemeProvider } from "@/hooks/useTheme";
import { SCHEMA_AUTHOR } from "@/lib/site";

export const metadata = {
  title: "JWT Decoder — Free Online Client-Side JWT Inspector",
  description:
    "Decode Base64URL JWT headers, payload claims, and expiration status in your browser. 100% private, client-side, zero network transmission.",
  openGraph: {
    title: "JWT Decoder — Devure JSON",
    description: "Inspect JWT claims, issued-at, expiration, and header properties securely offline in browser.",
  },
  alternates: { canonical: "/jwt-decoder" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JWT Decoder",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (runs in browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: SCHEMA_AUTHOR,
  description:
    "Decode Base64URL JWT headers, payload claims, and expiration status in your browser. 100% private, client-side, zero network transmission.",
};

export default function JwtDecoderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ThemeProvider>
        <JwtDecoderPlayground />
      </ThemeProvider>
    </>
  );
}
