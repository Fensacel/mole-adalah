'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';

type SortBy = 'win_rate' | 'ban_rate' | 'use_rate';
type SortOrder = 'desc' | 'asc';

interface RankHero {
  name: string;
  head: string;
  hero_id: number;
  win_rate: number;
  ban_rate: number;
  use_rate: number;
}

export default function RankingsClient({ initialRanks }: { initialRanks: RankHero[] }) {
  const [sortBy, setSortBy] = useState<SortBy>('win_rate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sorted = [...initialRanks].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  function WrIndicator({ wr }: { wr: number }) {
    const pct = (wr * 100).toFixed(1);
    if (wr >= 0.54) return <span className="flex items-center justify-end gap-1 text-green-400 font-bold"><TrendingUp className="w-3 h-3" />{pct}%</span>;
    if (wr <= 0.46) return <span className="flex items-center justify-end gap-1 text-red-400 font-bold"><TrendingDown className="w-3 h-3" />{pct}%</span>;
    return <span className="flex items-center justify-end gap-1 text-yellow-400 font-bold"><Minus className="w-3 h-3" />{pct}%</span>;
  }

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-7 h-7 text-yellow-400" />
            <h1 className="text-3xl font-black">Hero Rankings</h1>
          </div>
          <p className="text-gray-400">Ranking semua hero berdasarkan statistik terkini. Total {initialRanks.length} hero.</p>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          {([
            { key: 'win_rate', label: 'Win Rate', active: 'bg-orange-500/30 border-orange-500 text-orange-300', base: 'bg-white/5 border-white/10 text-gray-300' },
            { key: 'ban_rate', label: 'Ban Rate', active: 'bg-purple-500/30 border-purple-500 text-purple-300', base: 'bg-white/5 border-white/10 text-gray-300' },
            { key: 'use_rate', label: 'Use Rate', active: 'bg-blue-500/30 border-blue-500 text-blue-300', base: 'bg-white/5 border-white/10 text-gray-300' },
          ] as { key: SortBy; label: string; active: string; base: string }[]).map(({ key, label, active, base }) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border transition-all ${sortBy === key ? active : base + ' hover:border-white/20'}`}
            >
              {label}
              {sortBy === key && (
                <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> WR ≥ 54%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> WR 46–54%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> WR ≤ 46%</span>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#13151f]">
          {/* Header */}
          <div className="grid grid-cols-[48px_1fr_130px_130px_130px] gap-2 px-4 py-3 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
            <span className="text-center">#</span>
            <span>Hero</span>
            <span className="text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('win_rate')}>
              Win Rate {sortBy === 'win_rate' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </span>
            <span className="text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('ban_rate')}>
              Ban Rate {sortBy === 'ban_rate' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </span>
            <span className="text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('use_rate')}>
              Use Rate {sortBy === 'use_rate' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </span>
          </div>

          {/* Rows */}
          {sorted.map((hero, i) => {
            const rowBg = i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]';
            const rankLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
            const rankColor = i < 3 ? '' : 'text-gray-600';

            return (
              <Link
                key={hero.hero_id}
                href={`/heroes/${encodeURIComponent(hero.name)}`}
                className={`grid grid-cols-[48px_1fr_130px_130px_130px] gap-2 px-4 py-3 items-center hover:bg-white/5 transition-colors ${rowBg}`}
              >
                <span className={`text-center text-sm font-black ${rankColor}`}>{rankLabel}</span>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#0a0c14]">
                    <Image src={hero.head} alt={hero.name} fill className="object-cover" unoptimized sizes="32px" />
                  </div>
                  <span className="text-sm text-white font-semibold truncate">{hero.name}</span>
                </div>

                <div className="text-right text-sm"><WrIndicator wr={hero.win_rate} /></div>
                <div className="text-right text-sm font-bold text-purple-400">{(hero.ban_rate * 100).toFixed(1)}%</div>
                <div className="text-right text-sm font-bold text-blue-400">{(hero.use_rate * 100).toFixed(1)}%</div>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          {initialRanks.length} hero · Sort: {sortBy === 'win_rate' ? 'Win Rate' : sortBy === 'ban_rate' ? 'Ban Rate' : 'Use Rate'} ({sortOrder === 'desc' ? 'Tertinggi ke Terendah' : 'Terendah ke Tertinggi'})
        </p>
      </div>
    </div>
  );
}
