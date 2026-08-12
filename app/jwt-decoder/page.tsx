import { JwtDecoderPlayground } from "@/components/JwtDecoderPlayground";
import { ThemeProvider } from "@/hooks/useTheme";

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

export default function JwtDecoderPage() {
  return (
    <ThemeProvider>
      <JwtDecoderPlayground />
    </ThemeProvider>
  );
}
