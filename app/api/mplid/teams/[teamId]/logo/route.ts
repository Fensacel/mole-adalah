import { getMplIdTeamById } from "@/lib/api";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const team = await getMplIdTeamById(decodeURIComponent(teamId));

  if (!team?.team_logo) {
    return new Response("Team logo not found", { status: 404 });
  }

  return Response.redirect(team.team_logo, 302);
}
