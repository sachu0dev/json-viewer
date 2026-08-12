import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONVERTERS, CONVERTER_SLUGS } from "@/lib/converters/registry";
import { ConverterClientPage } from "./client";
import { SCHEMA_AUTHOR } from "@/lib/site";

export function generateStaticParams() {
  return CONVERTER_SLUGS.map((slug) => ({
    converterSlug: slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ converterSlug: string }>;
}): Promise<Metadata> {
  const { converterSlug } = await params;
  const config = CONVERTERS[converterSlug];
  if (!config) return {};

  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
    },
    alternates: { canonical: `/${converterSlug}` },
  };
}

export default async function DynamicConverterPage({
  params,
}: {
  params: Promise<{ converterSlug: string }>;
}) {
  const { converterSlug } = await params;
  const config = CONVERTERS[converterSlug];
  if (!config) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `JSON to ${config.targetName} Converter`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: SCHEMA_AUTHOR,
    description: config.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ConverterClientPage slug={converterSlug} />
    </>
  );
}
