import { getAllHeroes, getHeroDetail, getHeroPosition } from "@/lib/api";
import HeroesClient from "./HeroesClient";
export const runtime = 'edge';

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function HeroesPage({ searchParams }: Props) {
  const params = await searchParams;
  const [heroes, positions] = await Promise.all([getAllHeroes(), getHeroPosition()]);
  const roleMap: Record<number, string[]> = {};
  for (const p of positions) {
    if (p.roles.length > 0) {
      roleMap[p.hero_id] = Array.from(new Set([...(roleMap[p.hero_id] ?? []), ...p.roles]));
    }
  }

  // Fallback: some hero-position payloads only include a subset of heroes.
  if (Object.keys(roleMap).length < heroes.length * 0.7) {
    const missing = heroes.filter((hero) => !roleMap[hero.hero_id] || roleMap[hero.hero_id].length === 0);
    const detailResults = await Promise.allSettled(missing.map((hero) => getHeroDetail(hero.name)));

    detailResults.forEach((result, index) => {
      if (result.status !== "fulfilled" || !result.value?.role?.length) return;
      const heroId = missing[index]?.hero_id;
      if (!heroId) return;
      roleMap[heroId] = Array.from(new Set(result.value.role));
    });
  }

  return <HeroesClient initialHeroes={heroes} initialSearch={params.search ?? ""} initialRoleMap={roleMap} />;
}
