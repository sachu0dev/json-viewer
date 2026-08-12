import type { MetadataRoute } from "next";
import { CONVERTER_SLUGS } from "@/lib/converters/registry";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  const coreRoutes = [
    { route: "", priority: 1.0, changeFrequency: "daily" as const },
    { route: "/json-diff", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/large-files", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/jsonpath", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/jsonl-viewer", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/json-schema-validator", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/jwt-decoder", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/api-response", priority: 0.9, changeFrequency: "weekly" as const },
    { route: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  const converterRoutes = CONVERTER_SLUGS.map((slug) => ({
    route: `/${slug}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  const allRoutes = [...coreRoutes, ...converterRoutes];

  return allRoutes.map(({ route, priority, changeFrequency }) => ({
    url: `${SITE_URL}${route}`,
    lastModified: currentDate,
    changeFrequency,
    priority,
  }));
}
