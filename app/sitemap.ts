import type { MetadataRoute } from "next";
import { CONVERTER_SLUGS } from "@/lib/converters/registry";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const coreRoutes = [
    "",
    "/json-diff",
    "/large-files",
    "/jsonpath",
    "/jsonl-viewer",
    "/json-schema-validator",
    "/jwt-decoder",
    "/api-response",
    "/privacy",
  ];
  const converterRoutes = CONVERTER_SLUGS.map((slug) => `/${slug}`);
  const allRoutes = [...coreRoutes, ...converterRoutes];

  // No per-route change-tracking exists, so omit lastModified rather than
  // stamp every URL with the request-time "now" — a fabricated freshness
  // signal Google explicitly discounts once it notices every URL "changed"
  // on every crawl.
  return allRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
  }));
}
