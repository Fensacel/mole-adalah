import { getAllHeroes, getHeroDetail, getHeroPosition } from "@/lib/api";
import HeroesClient from "./HeroesClient";
export const runtime = 'edge';

const ROLE_FALLBACK_CONCURRENCY = 10;
const ROLE_FALLBACK_RETRIES = 2;

async function fetchHeroDetailWithRetry(name: string) {
  let attempt = 0;
  while (attempt <= ROLE_FALLBACK_RETRIES) {
    const detail = await getHeroDetail(name);
    if (detail?.role?.length) return detail;
    attempt += 1;
    if (attempt <= ROLE_FALLBACK_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 120 * attempt));
    }
  }
  return null;
}

async function hydrateMissingRoles(
  heroes: Array<{ hero_id: number; name: string }>,
  roleMap: Record<number, string[]>,
) {
  const missing = heroes.filter((hero) => !roleMap[hero.hero_id] || roleMap[hero.hero_id].length === 0);
  if (!missing.length) return;

  for (let i = 0; i < missing.length; i += ROLE_FALLBACK_CONCURRENCY) {
    const batch = missing.slice(i, i + ROLE_FALLBACK_CONCURRENCY);
    const results = await Promise.allSettled(batch.map((hero) => fetchHeroDetailWithRetry(hero.name)));

    results.forEach((result, index) => {
      if (result.status !== "fulfilled" || !result.value?.role?.length) return;
      const heroId = batch[index]?.hero_id;
      if (!heroId) return;
      roleMap[heroId] = Array.from(new Set(result.value.role));
    });
  }
}

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
    await hydrateMissingRoles(heroes, roleMap);

    // Safety net: one extra pass if coverage is still unexpectedly low.
    if (Object.keys(roleMap).length < heroes.length * 0.9) {
      await hydrateMissingRoles(heroes, roleMap);
    }
  }

  return <HeroesClient initialHeroes={heroes} initialSearch={params.search ?? ""} initialRoleMap={roleMap} />;
}
