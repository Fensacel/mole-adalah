import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Draft Formula Docs - Draft Whisperer",
  description: "Penjelasan rumus perhitungan draft: lineup rating, counter index, win probability, rekomendasi pick dan ban.",
};

const metricRows = [
  { key: "earlyMid", label: "Early to Mid Game Potential", weight: 1.1 },
  { key: "lateGame", label: "Late Game Potential", weight: 1.0 },
  { key: "damage", label: "Damage Potential", weight: 1.2 },
  { key: "survivability", label: "Survivability", weight: 1.1 },
  { key: "control", label: "Control Ability", weight: 1.0 },
  { key: "push", label: "Push Ability", weight: 0.8 },
  { key: "coordination", label: "Team Coordination", weight: 1.2 },
] as const;

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="rounded-3xl border border-blue-500/20 bg-[#0b1221] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-200/75">Documentation</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Draft Scoring Formula</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">
          Halaman ini menjelaskan cara kalkulasi penilaian draft di simulator: profile hero, lineup rating, counter index,
          win probability, sampai rekomendasi ban dan pick.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/draftsimulator" className="rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1.5 text-blue-100 hover:bg-blue-500/25">
            Open Draft Simulator
          </Link>
          <Link href="/heroes" className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-cyan-100 hover:bg-cyan-500/20">
            Explore Heroes
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#0d1324] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-blue-100">1) Hero Profile ke Team Metric</h2>
        <p className="mt-2 text-sm text-gray-300">
          Setiap hero dipetakan ke role, lalu role tersebut punya baseline kontribusi metric. Setelah itu dikoreksi pakai performa hero
          global dari WR, BR, dan Use Rate.
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-blue-200/75">Performance Boost</p>
          <p className="mt-2 font-mono text-sm text-gray-100">(winRate - 0.5) * 8 + useRate * 1.8 - banRate * 0.9</p>
          <p className="mt-2 text-xs text-gray-400">Nilai boost ini kemudian dipakai untuk adjust semua metric role hero.</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1324] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-blue-100">2) Team Profile dan Line Up Rating</h2>
        <p className="mt-2 text-sm text-gray-300">Profile tim dihitung dari rata-rata profile seluruh hero yang dipick tim tersebut.</p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#13203a] text-left text-blue-100">
                <th className="px-3 py-2">Metric</th>
                <th className="px-3 py-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => (
                <tr key={row.key} className="border-t border-white/10 text-gray-200">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2 font-semibold text-cyan-200">{row.weight.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-blue-200/75">Line Up Rating</p>
          <p className="mt-2 font-mono text-sm text-gray-100">sum(metric * weight) / sum(weight)</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1324] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-blue-100">3) Counter Index</h2>
        <p className="mt-2 text-sm text-gray-300">
          Counter index mengambil data increase win rate dari pasangan hero antar tim. Semua pair dihitung lalu dinormalisasi.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-4">
            <p className="text-xs uppercase tracking-wider text-blue-200/80">Blue Counter Index</p>
            <p className="mt-2 font-mono text-sm text-blue-100">(blueCounterRaw / pairCount) * 100</p>
          </div>
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4">
            <p className="text-xs uppercase tracking-wider text-red-200/80">Red Counter Index</p>
            <p className="mt-2 font-mono text-sm text-red-100">(redCounterRaw / pairCount) * 100</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-blue-200/75">Delta</p>
          <p className="mt-2 font-mono text-sm text-gray-100">delta = blueCounterIndex - redCounterIndex</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1324] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-blue-100">4) Win Probability</h2>
        <p className="mt-2 text-sm text-gray-300">Skor tim menggabungkan lineup rating, average WR tim, dan delta counter index.</p>
        <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm text-gray-100">
          <p>blueScore = blueLineupRating + blueAvgWR * 4 + delta * 0.45</p>
          <p>redScore = redLineupRating + redAvgWR * 4 - delta * 0.45</p>
          <p>blue% = blueScore / (blueScore + redScore) * 100</p>
          <p>red% = redScore / (blueScore + redScore) * 100</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1324] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-blue-100">5) Rekomendasi Pick dan Ban</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-400/30 bg-green-500/10 p-4">
            <p className="text-sm font-semibold text-green-200">Pick Recommendation</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-green-100/70">Saat ada enemy pick</p>
            <p className="mt-1 font-mono text-sm text-green-100">
              score = counterIncrease * 0.7 + winRate * 0.2 + useRate * 0.15 - banRate * 0.05
            </p>
            <p className="mt-2 text-xs text-green-100/80">Semakin tinggi, semakin direkomendasikan untuk dipick.</p>
          </div>

          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-200">Ban Recommendation</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-red-100/70">Threat + Pressure model</p>
            <p className="mt-1 font-mono text-sm text-red-100">threat = WR * 0.45 + BR * 0.35 + Use * 0.2</p>
            <p className="mt-1 font-mono text-sm text-red-100">score = threat + pressure * 0.9</p>
            <p className="mt-2 text-xs text-red-100/80">Pressure adalah seberapa kuat hero lawan meng-counter pick tim kamu saat ini.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-5 sm:p-6">
        <h2 className="text-xl font-bold text-yellow-100">Catatan Penting</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-yellow-50/90">
          <li>Semua angka adalah estimasi berbasis data statistik historis, bukan jaminan hasil match.</li>
          <li>Perubahan meta patch bisa membuat bobot ideal ikut berubah.</li>
          <li>Draft yang baik tetap perlu konteks player comfort, hero pool, dan execution tim.</li>
        </ul>
      </section>
    </div>
  );
}