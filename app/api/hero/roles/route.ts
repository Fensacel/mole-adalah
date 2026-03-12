import { getHeroPosition } from "@/lib/api";

export const runtime = "edge";

export async function GET() {
  const roleMap: Record<number, string[]> = {};
  const positions = await getHeroPosition();

  for (const position of positions) {
    roleMap[position.hero_id] = position.roles;
  }

  return Response.json({ roleMap }, { headers: { "cache-control": "public, s-maxage=3600" } });
}
