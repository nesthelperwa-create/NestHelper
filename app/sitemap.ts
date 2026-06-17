import type { MetadataRoute } from "next";
import { policies } from "@/lib/policies";
import { siteConfig } from "@/lib/siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/$/, "");
  const now = new Date();
  const brandImages = [
    `${siteUrl}/favicon.ico`,
    `${siteUrl}/favicon-48x48.png`,
    `${siteUrl}/favicon-96x96.png`,
    `${siteUrl}/icon.png`,
    `${siteUrl}${siteConfig.assets.icon}`,
    `${siteUrl}${siteConfig.assets.logo}`,
  ];
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
      changeFrequency: route === "" ? "weekly" as const : "monthly" as const,
      priority: route === "" ? 1 : route.includes("request") ? 0.9 : 0.7,
      ...(route === "" ? { images: brandImages } : {}),
    })),
    ...policies.map((policy) => ({
      url: `${siteUrl}/policies/${policy.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.45,
    })),
  ];
}
