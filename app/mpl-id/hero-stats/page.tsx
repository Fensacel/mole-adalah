import type { Metadata } from "next";
import { getMplIdEndpointHealth, getMplIdHeroStats } from "@/lib/api";
import MplDataTableSection from "../_components/MplDataTableSection";

export const metadata: Metadata = {
  title: "MPL ID Hero Stats - Draft Whisperer",
  description: "Hero stats MPL Indonesia.",
};

export default async function MplIdHeroStatsPage() {
  const [data, health] = await Promise.all([
    getMplIdHeroStats(),
    getMplIdEndpointHealth("/mplid/hero-stats/"),
  ]);

  return (
    <MplDataTableSection
      title="Hero Stats"
      description="Statistik hero MPL ID dari endpoint hero-stats."
      data={data}
      health={health}
    />
  );
}
