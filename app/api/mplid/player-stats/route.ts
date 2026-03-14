import { getMplIdPlayerStats } from "@/lib/api";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team") ?? undefined;
  const data = await getMplIdPlayerStats(team);
  return Response.json(data, { headers: { "cache-control": "public, s-maxage=300" } });
}
