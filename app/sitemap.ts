import type { MetadataRoute } from "next";
import { getAllHeroes } from "@/lib/api";
import { items } from "@/lib/items";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mlbb.mfchmufid.my.id";

const staticPaths = [
  "/",
  "/heroes",
  "/items",
  "/rankings",
  "/draft",
  "/draftsimulator",
  "/docs",
  "/mpl-id",
  "/mpl-id/team-stats",
  "/mpl-id/player-stats",
  "/mpl-id/hero-stats",
  "/mpl-id/hero-pools",
  "/mpl-id/player-pools",
  "/mpl-id/transfers",
  "/mpl-id/mvp-standings",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

  const itemEntries: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${siteUrl}/items/${encodeURIComponent(item.slug)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  let heroEntries: MetadataRoute.Sitemap = [];
  try {
    const heroes = await getAllHeroes();
    heroEntries = heroes.map((hero) => ({
      url: `${siteUrl}/heroes/${encodeURIComponent(hero.name)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    }));
  } catch {
    heroEntries = [];
  }

  return [...staticEntries, ...itemEntries, ...heroEntries];
}
