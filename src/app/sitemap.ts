import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://trnm-east.ir").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/catalog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];
  try {
    const { items } = await db.listVehicles({ publishedOnly: true, limit: 5000, sort: "newest" });
    return [...pages, ...items.map((v) => ({ url: `${SITE}/catalog/${v.id}`, lastModified: v.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 }))];
  } catch {
    return pages;
  }
}
