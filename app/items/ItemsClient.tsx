'use client';

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ItemData } from "@/lib/items";

type SortOrder = "asc" | "desc";

const CATEGORY_ORDER = ["all", "Attack", "Defense", "Magic", "Movement"] as const;
type Category = (typeof CATEGORY_ORDER)[number];

export default function ItemsClient({
  initialItems,
  initialSearch,
}: {
  initialItems: ItemData[];
  initialSearch: string;
}) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialItems.filter((item) => {
      const nameMatch = !q || item.name.toLowerCase().includes(q);
      const cat = item.stats[1] ?? "";
      const catMatch = selectedCategory === "all" || cat.toLowerCase() === selectedCategory.toLowerCase();
      return nameMatch && catMatch;
    });
  }, [initialItems, query, selectedCategory]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const result = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? result : -result;
    });
  }, [filteredItems, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">Mobile Legends Items</h1>
          <p className="text-sm text-gray-400">{sortedItems.length} items found</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sort</span>
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setSortOrder("asc")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                sortOrder === "asc" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              A-Z
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("desc")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                sortOrder === "desc" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Z-A
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items, e.g. Dominance Ice"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/60 transition-all"
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_ORDER.map((cat) => {
          const active = selectedCategory === cat;
          const colorMap: Record<Category, string> = {
            all: "border-blue-500 bg-blue-500/20 text-blue-300",
            Attack: "border-orange-500 bg-orange-500/20 text-orange-300",
            Defense: "border-cyan-500 bg-cyan-500/20 text-cyan-300",
            Magic: "border-purple-500 bg-purple-500/20 text-purple-300",
            Movement: "border-green-500 bg-green-500/20 text-green-300",
          };
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                active ? colorMap[cat] : "border-white/10 bg-white/5 text-gray-300 hover:border-white/30"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4">
        {sortedItems.map((item) => (
          <Link
            key={item.name}
            href={`/items/${item.slug}`}
            className="group rounded-xl overflow-hidden border border-white/5 hover:border-orange-500/50 bg-[#13151f] transition-all duration-300 hover:shadow-[0_0_24px_rgba(249,115,22,0.12)]"
          >
            <div className="relative aspect-square bg-[#0a0c14] p-3 sm:p-4">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
                unoptimized
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1280px) 16vw, 120px"
              />
            </div>
            <div className="px-2 py-2.5 sm:px-3 sm:py-3">
              <p className="text-[11px] sm:text-xs text-center text-gray-300 group-hover:text-white transition-colors leading-snug min-h-[2.25rem] flex items-center justify-center">
                {item.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}