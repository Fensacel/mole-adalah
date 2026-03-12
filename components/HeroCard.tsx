import Link from "next/link";
import Image from "next/image";

interface HeroCardProps {
  name: string;
  head: string;
  win_rate?: number;
  ban_rate?: number;
  use_rate?: number;
  statsMode?: "full" | "wr-only";
}

export default function HeroCard({ name, head, win_rate, ban_rate, use_rate, statsMode = "full" }: HeroCardProps) {
  const slug = encodeURIComponent(name);

  function rateColor(rate: number) {
    if (rate >= 0.54) return "text-green-400";
    if (rate <= 0.46) return "text-red-400";
    return "text-yellow-400";
  }

  return (
    <Link
      href={`/heroes/${slug}`}
      className="group relative bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.16)] transition-all duration-300 flex flex-col"
    >
      {/* Hero image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#0a0c14]">
        <Image
          src={head}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#13151f] via-[#13151f]/20 to-transparent" />
      </div>

      {/* Info */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col">
        <p className="font-bold text-sm sm:text-base text-white truncate mb-3">{name}</p>
        {win_rate !== undefined && statsMode === "wr-only" && (
          <div className="mt-auto">
            <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">WR</p>
            <p className={`font-bold text-base sm:text-lg ${rateColor(win_rate)}`}>{(win_rate * 100).toFixed(1)}%</p>
          </div>
        )}
        {win_rate !== undefined && statsMode === "full" && (
          <div className="mt-auto grid grid-cols-3 gap-2 sm:gap-3">
            <div className="text-center space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">WR</p>
              <p className={`font-bold text-base sm:text-lg ${rateColor(win_rate)}`}>{(win_rate * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">BR</p>
              <p className="font-bold text-base sm:text-lg text-purple-400">{(ban_rate! * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">UR</p>
              <p className="font-bold text-base sm:text-lg text-blue-400">{(use_rate! * 100).toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-500/0 group-hover:ring-blue-500/30 transition-all duration-300 pointer-events-none" />
    </Link>
  );
}
