import type { Metadata } from "next";
import { getMplIdEndpointHealth, getMplIdPlayerStats } from "@/lib/api";
import MplDataTableSection from "../_components/MplDataTableSection";

export const metadata: Metadata = {
  title: "MPL ID Player Stats - Draft Whisperer",
  description: "Player stats MPL Indonesia.",
};

export default async function MplIdPlayerStatsPage() {
  const [data, health] = await Promise.all([
    getMplIdPlayerStats(),
    getMplIdEndpointHealth("/mplid/player-stats/"),
  ]);

  return (
    <MplDataTableSection
      title="Player Stats"
      description="Statistik pemain MPL ID dari endpoint player-stats."
      data={data}
      health={health}
    />
  );
}
