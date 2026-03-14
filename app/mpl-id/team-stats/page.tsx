import type { Metadata } from "next";
import { getMplIdEndpointHealth, getMplIdTeamStats } from "@/lib/api";
import MplDataTableSection from "../_components/MplDataTableSection";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "MPL ID Team Stats - Draft Whisperer",
  description: "Statistik tim MPL Indonesia dari endpoint team-stats.",
};

export default async function MplIdTeamStatsPage() {
  const [stats, health] = await Promise.all([
    getMplIdTeamStats(),
    getMplIdEndpointHealth("/mplid/team-stats/"),
  ]);

  return (
    <MplDataTableSection
      title="Team Stats"
      description="Statistik tim MPL ID dari endpoint team-stats."
      data={stats}
      health={health}
    />
  );
}
