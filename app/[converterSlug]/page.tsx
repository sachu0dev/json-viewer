import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONVERTERS, CONVERTER_SLUGS } from "@/lib/converters/registry";
import { ConverterClientPage } from "./client";

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
  };
}

export default async function DynamicConverterPage({
  params,
}: {
  params: Promise<{ converterSlug: string }>;
}) {
  const { converterSlug } = await params;
  if (!CONVERTERS[converterSlug]) {
    notFound();
  }

  return <ConverterClientPage slug={converterSlug} />;
}
