import type { Metadata } from "next";
import { getMplIdEndpointHealth, getMplIdPlayerPools } from "@/lib/api";
import MplDataTableSection from "../_components/MplDataTableSection";

export const metadata: Metadata = {
  title: "MPL ID Player Pools - Draft Whisperer",
  description: "Player pools MPL Indonesia.",
};

export default async function MplIdPlayerPoolsPage() {
  const [data, health] = await Promise.all([
    getMplIdPlayerPools(),
    getMplIdEndpointHealth("/mplid/player-pools/"),
  ]);

  return (
    <MplDataTableSection
      title="Player Pools"
      description="Data player pools MPL ID dari endpoint player-pools."
      data={data}
      health={health}
    />
  );
}
