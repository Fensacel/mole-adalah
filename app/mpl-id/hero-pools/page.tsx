import type { Metadata } from "next";
import { getMplIdEndpointHealth, getMplIdHeroPools } from "@/lib/api";
import MplDataTableSection from "../_components/MplDataTableSection";

export const metadata: Metadata = {
  title: "MPL ID Hero Pools - Draft Whisperer",
  description: "Hero pools MPL Indonesia.",
};

export default async function MplIdHeroPoolsPage() {
  const [data, health] = await Promise.all([
    getMplIdHeroPools(),
    getMplIdEndpointHealth("/mplid/hero-pools/"),
  ]);

  return (
    <MplDataTableSection
      title="Hero Pools"
      description="Data hero pools MPL ID dari endpoint hero-pools."
      data={data}
      health={health}
    />
  );
}
