import { getMplIdTeamDetail } from "@/lib/api";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const data = await getMplIdTeamDetail(decodeURIComponent(teamId));

  if (!data) {
    return Response.json({ message: "Team detail not found" }, { status: 404 });
  }

  return Response.json(data, { headers: { "cache-control": "public, s-maxage=300" } });
}
