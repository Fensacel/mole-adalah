import Link from "next/link";
import { getAllHeroes, getHeroRank } from "@/lib/api";
import HeroCard from "@/components/HeroCard";
import { ArrowRight, BarChart2, Shield, Swords, Users } from "lucide-react";

export default async function HomePage() {
  const [heroes, rankings] = await Promise.all([getAllHeroes(), getHeroRank()]);
  const rankMap = new Map(rankings.map((r) => [r.name, r]));

  const topHeroes = rankings
    .filter((r) => r.win_rate > 0)
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, 8);

  const featured = heroes.slice(0, 16);

  return (
    <div>
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.05),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-xs text-orange-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Data real-time dari mlbb-stats.rone.dev
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Analitik Hero{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                MLBB
              </span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Temukan statistik win rate, ban rate, hero counter, dan synergy terbaik untuk setiap hero Mobile
              Legends: Bang Bang.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/heroes" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
                Jelajahi Hero <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/rankings" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
                Lihat Rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Users, label: "Total Hero", value: `${heroes.length}`, color: "text-blue-400" },
            { icon: BarChart2, label: "Punya Data Rate", value: `${rankings.length}`, color: "text-green-400" },
            { icon: Swords, label: "Tertinggi WR", value: topHeroes[0] ? `${(topHeroes[0].win_rate * 100).toFixed(1)}%` : "—", color: "text-orange-400" },
            { icon: Shield, label: "Tertinggi BR", value: rankings.length ? `${(Math.max(...rankings.map((r) => r.ban_rate)) * 100).toFixed(1)}%` : "—", color: "text-purple-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[#13151f] border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/5 ${color}`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-xl font-black ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Win Rate */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Top Win Rate</h2>
            <p className="text-sm text-gray-500">Hero dengan win rate tertinggi saat ini</p>
          </div>
          <Link href="/rankings" className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {topHeroes.map((hero) => (
            <HeroCard key={hero.hero_id} name={hero.name} head={hero.head} win_rate={hero.win_rate} ban_rate={hero.ban_rate} use_rate={hero.use_rate} statsMode="wr-only" />
          ))}
        </div>
      </section>

      {/* All heroes preview */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Semua Hero</h2>
            <p className="text-sm text-gray-500">{heroes.length} hero tersedia</p>
          </div>
          <Link href="/heroes" className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {featured.map((hero) => {
            const rank = rankMap.get(hero.name);
            return <HeroCard key={hero.hero_id} name={hero.name} head={hero.head} win_rate={rank?.win_rate} ban_rate={rank?.ban_rate} use_rate={rank?.use_rate} />;
          })}
        </div>
        <div className="mt-8 text-center">
          <Link href="/heroes" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 px-6 py-2.5 rounded-xl transition-colors">
            Tampilkan semua {heroes.length} hero <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#0a0c14] border-y border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Fitur Dashboard</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: BarChart2, title: "Statistik Lengkap", desc: "Win Rate, Ban Rate, dan Use Rate untuk setiap hero dengan visualisasi interaktif.", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
              { icon: Swords, title: "Counter & Synergy", desc: "Temukan hero terbaik untuk melawan atau bermain bersama hero pilihanmu.", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
              { icon: Shield, title: "Grafik Perbandingan", desc: "Bandingkan win rate hero dengan hero counter-nya secara visual.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className={`border ${bg} rounded-xl p-6`}>
                <div className={`${color} mb-4`}><Icon className="w-8 h-8" /></div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

