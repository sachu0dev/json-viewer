import type { MetadataRoute } from "next";
import { CONVERTER_SLUGS } from "@/lib/converters/registry";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const coreRoutes = ["", "/json-diff", "/large-files", "/jsonpath", "/jsonl-viewer"];
  const converterRoutes = CONVERTER_SLUGS.map((slug) => `/${slug}`);
  const allRoutes = [...coreRoutes, ...converterRoutes];

  return allRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));
}
