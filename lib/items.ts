import rawItems from "@/app/items/items_data.json";

export interface ItemData {
  name: string;
  slug: string;
  image_url: string;
  stats: string[];
}

export const items: ItemData[] = (rawItems as ItemData[]).slice();

export function getItemBySlug(slug: string) {
  return items.find((item) => item.slug === slug);
}
