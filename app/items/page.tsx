import { items } from "@/lib/items";
import ItemsClient from "./ItemsClient";

export const runtime = 'edge';

export const metadata = {
  title: "Item MLBB - DraftWhisperer",
  description: "Daftar item Mobile Legends lengkap beserta gambar item.",
};

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function ItemsPage({ searchParams }: Props) {
  const params = await searchParams;
  return <ItemsClient initialItems={items} initialSearch={params.search ?? ""} />;
}
