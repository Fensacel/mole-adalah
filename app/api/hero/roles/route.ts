import { getHeroPosition } from "@/lib/api";
import roleMapSeed from "@/data/roleMapSeed.json";

export const runtime = "edge";

export async function GET() {
  const roleMap: Record<number, string[]> = Object.fromEntries(
    Object.entries(roleMapSeed).map(([heroId, roles]) => [Number(heroId), Array.from(new Set(roles))]),
  );
  const positions = await getHeroPosition();

  for (const position of positions) {
    roleMap[position.hero_id] = Array.from(new Set([...(roleMap[position.hero_id] ?? []), ...position.roles]));
  }

  return Response.json({ roleMap }, { headers: { "cache-control": "public, s-maxage=3600" } });
}
