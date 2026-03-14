import { getMplIdTeams } from "@/lib/api";

export const runtime = "edge";

export async function GET() {
  const data = await getMplIdTeams();
  return Response.json(data, { headers: { "cache-control": "public, s-maxage=300" } });
}
