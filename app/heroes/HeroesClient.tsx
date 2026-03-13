"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroListItem } from "@/lib/api";

const ROLE_ORDER = ["all", "Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"] as const;

function normalizeRole(value: string) {
  const v = value.trim().toLowerCase();
  if (!v) return "";
  if (v === "mm" || v.includes("marksman")) return "marksman";
  if (v.includes("assassin")) return "assassin";
  if (v.includes("fighter")) return "fighter";
  if (v.includes("tank")) return "tank";
  if (v.includes("mage")) return "mage";
  if (v.includes("support")) return "support";
  return v;
}

export default function HeroesClient({
  initialHeroes,
  initialSearch,
  initialRoleMap,
}: {
  initialHeroes: HeroListItem[];
  initialSearch: string;
  initialRoleMap: Record<number, string[]>;
}) {
  const [query, setQuery] = useState(initialSearch);
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_ORDER)[number]>("all");
  const roleMap = initialRoleMap;

  const filteredHeroes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialHeroes.filter((hero) => {
      const nameMatch = !q || hero.name.toLowerCase().includes(q);
      const roles = (roleMap[hero.hero_id] ?? []).map(normalizeRole);
      const roleMatch = selectedRole === "all" || roles.includes(normalizeRole(selectedRole));
      return nameMatch && roleMatch;
    });
  }, [initialHeroes, query, selectedRole, roleMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-1">Mobile Legends Heroes</h1>
        <p className="text-gray-400 text-sm">{filteredHeroes.length} heroes found</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search heroes, e.g. Ling"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {ROLE_ORDER.map((role) => {
          const active = selectedRole === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-blue-500/40"
              }`}
            >
              {role === "all" ? "All Roles" : role}
            </button>
          );
        })}
      </div>

      {filteredHeroes.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-2">
          {filteredHeroes.map((hero) => (
            <Link
              key={hero.hero_id}
              href={`/heroes/${encodeURIComponent(hero.name)}`}
              className="group rounded-lg overflow-hidden border border-white/5 hover:border-blue-500/60 transition-all bg-[#13151f]"
            >
              <div className="relative aspect-square bg-[#0a0c14]">
                <Image
                  src={hero.head}
                  alt={hero.name}
                  fill
                  className="object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-300"
                  unoptimized
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 100px"
                />
              </div>
              <p className="text-[10px] sm:text-xs text-center py-1 px-1 truncate text-gray-400 group-hover:text-white transition-colors">
                {hero.name}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-xl font-bold mb-2">No heroes found</p>
          <p className="text-gray-500 text-sm">Try a different keyword or role.</p>
        </div>
      )}
    </div>
  );
}
