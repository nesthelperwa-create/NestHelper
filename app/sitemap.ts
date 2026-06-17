import type { MetadataRoute } from "next";
import { policies } from "@/lib/policies";
import { siteConfig } from "@/lib/siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteConfig.url.replace(/\/$/, "");
  const now = new Date();
  const staticRoutes = [
    "",
    "/services",
    "/request",
    "/trust",
    "/helpers",
    "/faq",
    "/contact",
    "/giving-back",
    "/referrals",
    "/commercial-reset",
    "/commercial-reset/request",
    "/policies",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route.includes("request") ? 0.9 : 0.7,
    })),
    ...policies.map((policy) => ({
      url: `${siteUrl}/policies/${policy.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.45,
    })),
  ];
}
