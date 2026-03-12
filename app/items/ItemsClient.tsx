'use client';

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ItemData } from "@/lib/items";

type SortOrder = "asc" | "desc";

export default function ItemsClient({ initialItems }: { initialItems: ItemData[] }) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const sortedItems = useMemo(() => {
    return [...initialItems].sort((a, b) => {
      const result = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? result : -result;
    });
  }, [initialItems, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">Item Mobile Legends</h1>
          <p className="text-sm text-gray-400">{sortedItems.length} item tersedia</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Urutkan</span>
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setSortOrder("asc")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                sortOrder === "asc" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              A-Z
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("desc")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                sortOrder === "desc" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Z-A
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4">
        {sortedItems.map((item) => (
          <div
            key={item.name}
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
          </div>
        ))}
      </div>
    </div>
  );
}