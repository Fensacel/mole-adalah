import { getMplIdHeroStats } from "@/lib/api";

export const runtime = "edge";

export async function GET() {
  const data = await getMplIdHeroStats();
  return Response.json(data, { headers: { "cache-control": "public, s-maxage=300" } });
}
