import { items } from "@/lib/items";
import ItemsClient from "./ItemsClient";

export const runtime = 'edge';

export const metadata = {
  title: "MLBB Items - Draft Whisperer",
  description: "Complete Mobile Legends item list with item images.",
};

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function ItemsPage({ searchParams }: Props) {
  const params = await searchParams;
  return <ItemsClient initialItems={items} initialSearch={params.search ?? ""} />;
}
