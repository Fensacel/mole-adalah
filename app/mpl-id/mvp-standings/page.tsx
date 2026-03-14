import type { Metadata } from "next";
import { getMplIdEndpointHealth } from "@/lib/api";
import MplDataTableSection from "../_components/MplDataTableSection";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "MPL ID MVP Standings - Draft Whisperer",
  description: "MVP standings MPL Indonesia.",
};

export default async function MplIdMvpStandingsPage() {
  const health = await getMplIdEndpointHealth("/mplid/mvp-standings/");

  return (
    <MplDataTableSection
      title="MVP Standings"
      description="Endpoint mvp standings dari docs. Jika source belum tersedia, status akan terlihat di bawah."
      data={[]}
      health={health}
    />
  );
}
