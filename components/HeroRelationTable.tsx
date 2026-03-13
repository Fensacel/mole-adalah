import Image from "next/image";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { SubHero } from "@/lib/api";

interface HeroRelationTableProps {
  title: string;
  subtitle?: string;
  heroes: SubHero[];
  type: "counter" | "synergy";
  mainWinRate: number;
}

export default function HeroRelationTable({
  title,
  subtitle,
  heroes,
  type,
  mainWinRate,
}: HeroRelationTableProps) {
  const accentColor = type === "counter" ? "text-red-400" : "text-green-400";
  const borderColor = type === "counter" ? "border-red-500/20" : "border-green-500/20";
  const bgColor = type === "counter" ? "bg-red-500/5" : "bg-green-500/5";

  return (
    <div className={`border ${borderColor} ${bgColor} rounded-xl overflow-hidden`}>
      <div className="p-4 border-b border-white/5">
        <h3 className={`font-bold text-sm ${accentColor}`}>{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="divide-y divide-white/5">
        {heroes.map((hero, i) => {
          const delta = hero.increase_win_rate;
          const positive = delta >= 0;

          return (
            <Link
              key={`${hero.hero_id}-${i}`}
              href={`/heroes/${encodeURIComponent(hero.name)}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
            >
              <span className="text-xs text-gray-600 w-4 shrink-0">{i + 1}</span>
              <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#0a0c14]">
                <Image
                  src={hero.head}
                  alt={hero.name}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="36px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                  {hero.name}
                </p>
                <p className="text-xs text-gray-500">
                  WR {(hero.hero_win_rate * 100).toFixed(1)}%
                </p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${positive ? "text-green-400" : "text-red-400"}`}>
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {positive ? "+" : ""}{(delta * 100).toFixed(1)}%
              </div>
            </Link>
          );
        })}

        {heroes.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
