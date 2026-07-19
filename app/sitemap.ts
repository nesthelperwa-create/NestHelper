import type { MetadataRoute } from "next";
import { policies } from "@/lib/policies";
import { siteConfig } from "@/lib/siteConfig";

const siteUrl = siteConfig.url.replace(/\/$/, "");

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
  "/service-area/snohomish-county",
  "/policies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-18T00:00:00.000Z");

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route.includes("request") ? 0.9 : route === "/giving-back" ? 0.7 : 0.7,
    })),
    ...policies.map((policy) => ({
      url: `${siteUrl}/policies/${policy.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.45,
    })),
  ];
}
