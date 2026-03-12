import { getAllHeroes, getHeroDetail, getHeroPosition, getHeroRank } from '@/lib/api';
import DraftClient from './DraftClient';

export const metadata = {
  title: 'Simulasi Draft - DraftWhisperer',
  description: '',
};

export default async function DraftPage() {
  const [heroes, ranks, positions] = await Promise.all([getAllHeroes(), getHeroRank(), getHeroPosition()]);
  const roleMap: Record<number, string[]> = {};
  for (const position of positions) {
    if (!position.roles.length) continue;
    roleMap[position.hero_id] = Array.from(new Set([...(roleMap[position.hero_id] ?? []), ...position.roles]));
  }

  // Fallback: hero-position API can be partial, so enrich missing roles from hero-detail.
  if (Object.keys(roleMap).length < heroes.length * 0.7) {
    const missingHeroes = heroes.filter((hero) => !roleMap[hero.hero_id] || roleMap[hero.hero_id].length === 0);
    const detailResults = await Promise.allSettled(missingHeroes.map((hero) => getHeroDetail(hero.name)));

    detailResults.forEach((result, index) => {
      if (result.status !== 'fulfilled' || !result.value?.role?.length) return;
      const heroId = missingHeroes[index]?.hero_id;
      if (!heroId) return;
      roleMap[heroId] = Array.from(new Set(result.value.role));
    });
  }

  return <DraftClient heroes={heroes} ranks={ranks} roleMap={roleMap} />;
}
