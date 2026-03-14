import type { Metadata } from "next";
import { getMplIdEndpointHealth, getMplIdTransfers } from "@/lib/api";
import MplDataTableSection from "../_components/MplDataTableSection";

export const metadata: Metadata = {
  title: "MPL ID Transfers - Draft Whisperer",
  description: "Transfer data MPL Indonesia.",
};

export default async function MplIdTransfersPage() {
  const [data, health] = await Promise.all([
    getMplIdTransfers(),
    getMplIdEndpointHealth("/mplid/transfers/"),
  ]);

  return (
    <MplDataTableSection
      title="Transfers"
      description="Data perpindahan roster tim MPL ID dari endpoint transfers."
      data={data}
      health={health}
    />
  );
}
