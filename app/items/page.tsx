import { items } from "@/lib/items";
import ItemsClient from "./ItemsClient";

export const metadata = {
  title: "Item MLBB - MLBB Analytics",
  description: "Daftar item Mobile Legends lengkap beserta gambar item.",
};

export default function ItemsPage() {
  return <ItemsClient initialItems={items} />;
}
