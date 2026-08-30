import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildpay.co";

  const routes = [
    "",
    "/dashboard",
    "/batches",
    "/transactions",
    "/exceptions",
    "/ai-insights",
    "/reports",
    "/audit",
    "/copilot",
    "/upload",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" || route === "/dashboard" ? 1.0 : 0.8,
  }));
}
