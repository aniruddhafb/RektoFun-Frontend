import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/challenges", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/activity", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/leaderboard", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return pages.map(({ path, ...entry }) => ({ url: `https://rekto.fun${path}`, ...entry }));
}
