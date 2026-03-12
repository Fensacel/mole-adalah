import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getHeroDetail,
  getHeroRate,
  getHeroCounter,
  getHeroCompatibility,
} from "@/lib/api";
import StatCard from "@/components/StatCard";
import HeroRelationTable from "@/components/HeroRelationTable";
import WinRateChart from "@/components/WinRateChart";
import { ArrowLeft, Shield, Swords, Target } from "lucide-react";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params;
  const heroName = decodeURIComponent(name);
  return {
    title: `${heroName} — MLBB Analytics`,
    description: `Statistik, counter, dan synergy untuk hero ${heroName} di Mobile Legends.`,
  };
}

export default async function HeroDetailPage({ params }: Props) {
  const { name } = await params;
  const heroName = decodeURIComponent(name);

  const [detail, rate, counter, compatibility] = await Promise.all([
    getHeroDetail(heroName),
    getHeroRate(heroName),
    getHeroCounter(heroName),
    getHeroCompatibility(heroName),
  ]);

  if (!detail) notFound();

  const winRate = counter?.main_hero_win_rate ?? rate?.win_rate ?? 0;
  const banRate = counter?.main_hero_ban_rate ?? rate?.ban_rate ?? 0;
  const useRate = counter?.main_hero_appearance_rate ?? rate?.app_rate ?? 0;

  const chartMain = { name: detail.name, win_rate: winRate };
  const counterChartData = counter?.counters.slice(0, 5).map((h) => ({ name: h.name, win_rate: h.hero_win_rate })) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Back button */}
      <Link
        href="/heroes"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Hero
      </Link>

      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden bg-[#13151f] border border-white/5 mb-8">
        {/* Background painting blur */}
        {detail.painting && (
          <div className="absolute inset-0 opacity-10">
            <Image src={detail.painting} alt="" fill className="object-cover object-top" unoptimized sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#13151f] via-[#13151f]/80 to-transparent" />
          </div>
        )}

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8">
          {/* Avatar */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-orange-500/30 shrink-0 bg-[#0a0c14]">
            <Image src={detail.head} alt={detail.name} fill className="object-cover" unoptimized sizes="128px" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {detail.role.map((r) => (
                <span key={r} className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  {r}
                </span>
              ))}
              {detail.lane.map((l) => (
                <span key={l} className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  {l}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">{detail.name}</h1>
            {detail.specialty.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-gray-500">Speciality:</span> {detail.specialty.join(", ")}
              </p>
            )}
            {detail.story && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{detail.story}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Win Rate"
          value={winRate > 0 ? `${(winRate * 100).toFixed(1)}%` : "—"}
          color="green"
          description={winRate >= 0.54 ? "Di atas rata-rata" : winRate <= 0.46 ? "Di bawah rata-rata" : "Rata-rata"}
        />
        <StatCard
          label="Ban Rate"
          value={banRate > 0 ? `${(banRate * 100).toFixed(1)}%` : "—"}
          color="purple"
          description={banRate > 0.2 ? "Sering di-ban" : "Jarang di-ban"}
        />
        <StatCard
          label="Use Rate"
          value={useRate > 0 ? `${(useRate * 100).toFixed(1)}%` : "—"}
          color="blue"
          description={useRate > 0.05 ? "Banyak dimainkan" : "Jarang dimainkan"}
        />
      </div>

      {/* Win Rate Chart */}
      {counterChartData.length > 0 && (
        <div className="mb-8">
          <WinRateChart mainHero={chartMain} counterHeroes={counterChartData} />
        </div>
      )}

      {/* Counter & Compatibility tables */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Counter section */}
        {counter && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Swords className="w-5 h-5" />
              <h2 className="font-bold text-lg">Counter Hero</h2>
            </div>
            <HeroRelationTable
              title="Hero yang diuntungkan melawan ini"
              subtitle="Hero yang memiliki win rate lebih tinggi saat melawan hero ini"
              heroes={counter.counters}
              type="counter"
              mainWinRate={winRate}
            />
            {counter.worst_matchups.length > 0 && (
              <HeroRelationTable
                title="Hero yang lemah melawan ini"
                subtitle="Hero yang kalah saat dihadapkan dengan hero ini"
                heroes={counter.worst_matchups}
                type="counter"
                mainWinRate={winRate}
              />
            )}
          </div>
        )}

        {/* Compatibility section */}
        {compatibility && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <Shield className="w-5 h-5" />
              <h2 className="font-bold text-lg">Synergy Hero</h2>
            </div>
            <HeroRelationTable
              title="Hero yang cocok bersama ini"
              subtitle="Hero yang meningkatkan win rate saat bermain bersama hero ini"
              heroes={compatibility.best_synergies}
              type="synergy"
              mainWinRate={winRate}
            />
            {compatibility.worst_synergies.length > 0 && (
              <HeroRelationTable
                title="Hero yang kurang cocok bersama ini"
                subtitle="Hero yang menurunkan win rate saat bermain bersama"
                heroes={compatibility.worst_synergies}
                type="counter"
                mainWinRate={winRate}
              />
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {!counter && !compatibility && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <Target className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="font-bold text-yellow-300 mb-1">Data statistik tidak tersedia</p>
          <p className="text-sm text-gray-400">API tidak mengembalikan data counter/compatibility untuk hero ini.</p>
        </div>
      )}
    </div>
  );
}
