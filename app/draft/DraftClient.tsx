'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { HeroListItem } from '@/lib/api';
import { RotateCcw, SkipBack, X } from 'lucide-react';

type Team = 'blue' | 'red';
type Phase = 'setup' | 'ban' | 'pick' | 'done';
type Role = 'all' | 'tank' | 'fighter' | 'assassin' | 'mage' | 'support' | 'marksman';

const PICK_TURNS: Team[] = ['blue','red','red','blue','blue','red','red','blue','blue','red'];
const BAN_OPTIONS = [3, 4, 5] as const;
const ROLES: { label: string; value: Role }[] = [
  { label: 'SEMUA', value: 'all' },
  { label: 'TANK', value: 'tank' },
  { label: 'FIGHTER', value: 'fighter' },
  { label: 'ASSASSIN', value: 'assassin' },
  { label: 'MAGE', value: 'mage' },
  { label: 'SUPPORT', value: 'support' },
  { label: 'MARKSMAN', value: 'marksman' },
];

interface RankHero { name: string; hero_id: number; win_rate: number; ban_rate: number; use_rate: number; }
interface CounterHero { name: string; head: string; hero_id: number; hero_win_rate: number; increase_win_rate: number; }
interface HeroDetail { name: string; hero_id: number; role: string[]; head: string; }

function createBanSlots(count: number) {
  return Array.from({ length: count }, () => null as HeroListItem | null);
}

export default function DraftClient({ heroes, ranks }: { heroes: HeroListItem[]; ranks: RankHero[] }) {
  const [side, setSide] = useState<Team | null>(null);
  const [banCount, setBanCount] = useState<3 | 4 | 5>(3);
  const [phase, setPhase] = useState<Phase>('setup');
  const [banStep, setBanStep]   = useState(0);
  const [pickStep, setPickStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role>('all');
  const [history, setHistory] = useState<Array<{ type: 'ban'|'pick'; team: Team; hero: HeroListItem }>>([]);

  const [blueBans,  setBlueBans]  = useState<(HeroListItem | null)[]>(createBanSlots(3));
  const [redBans,   setRedBans]   = useState<(HeroListItem | null)[]>(createBanSlots(3));
  const [bluePicks, setBluePicks] = useState<(HeroListItem | null)[]>([null, null, null, null, null]);
  const [redPicks,  setRedPicks]  = useState<(HeroListItem | null)[]>([null, null, null, null, null]);
  const [usedIds,   setUsedIds]   = useState<Set<number>>(new Set());
  const [heroRoles, setHeroRoles] = useState<Map<number, string[]>>(new Map());


  const [selected, setSelected] = useState<HeroListItem | null>(null);
  const [counterData, setCounterData] = useState<{ counters: CounterHero[]; worst_matchups: CounterHero[] } | null>(null);
  const [counterLoading, setCounterLoading] = useState(false);

  const rankMap = new Map(ranks.map(r => [r.name, r.win_rate]));
  const banTurns = useMemo(
    () => Array.from({ length: banCount * 2 }, (_, index) => (index % 2 === 0 ? 'blue' : 'red') as Team),
    [banCount],
  );
  const currentTurn: Team = phase === 'ban' ? banTurns[Math.min(banStep, banTurns.length - 1)] : PICK_TURNS[Math.min(pickStep, PICK_TURNS.length - 1)];

  // Filter heroes by selected role
  const filteredHeroes = useMemo(() => {
    return heroes.filter(h => !usedIds.has(h.hero_id));
  }, [heroes, usedIds]);

  const handleHeroClick = async (hero: HeroListItem) => {
    if (usedIds.has(hero.hero_id)) return;
    setSelected(hero);
    setCounterData(null);
    setCounterLoading(true);
    try {
      const res = await fetch(`/api/hero/counter/${encodeURIComponent(hero.name)}`);
      if (res.ok) setCounterData(await res.json());
    } catch { /* ignore */ }
    finally { setCounterLoading(false); }
  };

  const startDraft = (team: Team) => {
    setSide(team);
    setPhase('ban');
    setBanStep(0);
    setPickStep(0);
    setSelectedRole('all');
    setHistory([]);
    setBlueBans(createBanSlots(banCount));
    setRedBans(createBanSlots(banCount));
    setBluePicks([null, null, null, null, null]);
    setRedPicks([null, null, null, null, null]);
    setUsedIds(new Set());
    setSelected(null);
  };

  const confirmAction = () => {
    if (!selected) return;
    const newUsedIds = new Set([...usedIds, selected.hero_id]);
    setUsedIds(newUsedIds);
    setHistory([...history, { type: phase === 'ban' ? 'ban' : 'pick', team: currentTurn, hero: selected }]);

    if (phase === 'ban') {
      if (currentTurn === 'blue') {
        const next = [...blueBans];
        next[next.findIndex(b => b === null)] = selected;
        setBlueBans(next);
      } else {
        const next = [...redBans];
        next[next.findIndex(b => b === null)] = selected;
        setRedBans(next);
      }
      if (banStep + 1 >= banTurns.length) setPhase('pick');
      else setBanStep(s => s + 1);
    } else {
      if (currentTurn === 'blue') {
        const next = [...bluePicks];
        next[next.findIndex(b => b === null)] = selected;
        setBluePicks(next);
      } else {
        const next = [...redPicks];
        next[next.findIndex(b => b === null)] = selected;
        setRedPicks(next);
      }
      if (pickStep + 1 >= PICK_TURNS.length) setPhase('done');
      else setPickStep(s => s + 1);
    }
    setSelected(null);
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const newUsedIds = new Set(usedIds);
    newUsedIds.delete(last.hero.hero_id);
    setHistory(newHistory);
    setUsedIds(newUsedIds);
    setSelected(null);

    if (last.type === 'ban') {
      if (last.team === 'blue') setBlueBans(b => b.map((h, i) => h?.hero_id === last.hero.hero_id ? null : h));
      else setRedBans(r => r.map((h, i) => h?.hero_id === last.hero.hero_id ? null : h));
      if (phase !== 'ban') {
        setPhase('ban');
        setBanStep(Math.max(0, banTurns.length - 1));
        setPickStep(0);
      } else {
        setBanStep(h => Math.max(0, h - 1));
      }
    } else {
      if (last.team === 'blue') setBluePicks(p => p.map((h, i) => h?.hero_id === last.hero.hero_id ? null : h));
      else setRedPicks(p => p.map((h, i) => h?.hero_id === last.hero.hero_id ? null : h));
      if (phase === 'done') {
        setPhase('pick');
        setPickStep(PICK_TURNS.length - 1);
      } else {
        setPickStep(s => Math.max(0, s - 1));
      }
    }
  };

  const reset = () => {
    setSide(null); setPhase('setup'); setBanStep(0); setPickStep(0); setSelectedRole('all'); setHistory([]);
    setBlueBans(createBanSlots(banCount)); setRedBans(createBanSlots(banCount));
    setBluePicks([null,null,null,null,null]); setRedPicks([null,null,null,null,null]);
    setUsedIds(new Set()); setSelected(null);
  };

  const winProb = (() => {
    const bWRs = bluePicks.filter(Boolean).map(h => rankMap.get(h!.name) ?? 0.5);
    const rWRs = redPicks.filter(Boolean).map(h => rankMap.get(h!.name) ?? 0.5);
    if (!bWRs.length && !rWRs.length) return null;
    const bAvg = bWRs.length ? bWRs.reduce((a, b) => a + b, 0) / bWRs.length : 0.5;
    const rAvg = rWRs.length ? rWRs.reduce((a, b) => a + b, 0) / rWRs.length : 0.5;
    const total = bAvg + rAvg;
    return { blue: bAvg / total * 100, red: rAvg / total * 100 };
  })();

  // ─── SETUP ───────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[#0d0f17] text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-black mb-3">Simulasi Draft</h1>
        <p className="text-gray-400 mb-6 text-center max-w-sm text-sm">Atur jumlah ban dulu, lalu pilih posisi timmu.</p>
        <div className="w-full max-w-sm mb-6">
          <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 text-center">Ban per tim</p>
          <div className="grid grid-cols-3 gap-2">
            {BAN_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBanCount(option)}
                className={`rounded-xl border px-4 py-3 text-sm font-black transition-all ${
                  banCount === option
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-orange-500/40 hover:bg-white/10'
                }`}
              >
                {option} Ban
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">Total fase ban: {banCount * 2} ban, lalu 10 pick</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-sm">
          <button
            onClick={() => startDraft('blue')}
            className="bg-blue-500/15 border-2 border-blue-400 rounded-xl p-5 hover:bg-blue-500/25 active:scale-95 transition-all"
          >
            <p className="font-black text-lg text-blue-300 mb-1">🔵 Tim Biru</p>
            <p className="text-xs text-gray-400">First Pick</p>
          </button>
          <button
            onClick={() => startDraft('red')}
            className="bg-red-500/15 border-2 border-red-400 rounded-xl p-5 hover:bg-red-500/25 active:scale-95 transition-all"
          >
            <p className="font-black text-lg text-red-300 mb-1">🔴 Tim Merah</p>
            <p className="text-xs text-gray-400">Second Pick</p>
          </button>
        </div>
      </div>
    );
  }


  // ─── DRAFT ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d0f17] text-white">
      {/* Desktop: 3-column layout | Mobile: stacked */}
      <div className="max-w-[1400px] mx-auto px-2 md:px-4 py-4 min-h-screen flex flex-col lg:flex-row gap-3 md:gap-4">
        
        {/* LEFT PANEL - Team Biru (Blue Team Picks) */}
        <div className="flex-shrink-0 w-full lg:w-24 xl:w-28 order-3 lg:order-1">
          <div className="sticky top-20 space-y-1.5 md:space-y-2">
            <p className="text-[9px] md:text-[10px] font-black text-blue-400 mb-1.5 text-center">TIM BIRU</p>
            {bluePicks.map((h, i) => (
              <div
                key={i}
                className={`relative w-full aspect-square bg-[#13151f] border-2 rounded-lg overflow-hidden flex items-center justify-center transition-all ${
                  h
                    ? 'border-blue-500/60'
                    : phase === 'pick' && currentTurn === 'blue' && bluePicks.findIndex(p => p === null) === i
                    ? 'border-orange-400 animate-pulse'
                    : 'border-white/10'
                }`}
              >
                {h ? (
                  <Image src={h.head} alt={h.name} fill className="object-cover" unoptimized sizes="120px" />
                ) : (
                  <span className="text-[10px] md:text-xs text-gray-700">Pick {i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER - Hero Grid & Controls */}
        <div className="flex-1 order-2 flex flex-col">
          {/* Header with bans & status */}
          <div className="bg-[#13151f] border border-white/5 rounded-lg p-2.5 md:p-3 mb-3 md:mb-4">
            <div className="grid grid-cols-[auto_1fr_auto] gap-2 md:gap-3 items-start">
              {/* Blue Bans */}
              <div className="flex gap-1 items-center">
                <p className="text-[8px] md:text-[9px] font-bold text-blue-300 whitespace-nowrap">BANS</p>
                <div className="flex gap-0.5 md:gap-1">
                  {blueBans.map((h, i) => (
                    <div
                      key={i}
                      className={`relative rounded-full border-2 overflow-hidden flex-shrink-0 ${
                        h ? 'border-red-500/40 w-9 h-9 md:w-11 md:h-11' : 'border-white/10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center'
                      } bg-[#0a0c14]`}
                    >
                      {h ? (
                        <>
                          <Image src={h.head} alt={h.name} fill className="object-cover grayscale brightness-50" unoptimized sizes="44px" />
                          <span className="absolute inset-0 flex items-center justify-center text-red-400 font-black text-[10px]">✕</span>
                        </>
                      ) : (
                        <span className="text-[8px] text-gray-600">B</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Probability */}
              <div className="text-center px-2">
                {phase !== 'done' ? (
                  <>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${phase === 'ban' ? 'text-red-400' : 'text-green-400'}`}>
                      {phase === 'ban' ? '🚫 FASE BAN' : '👤 FASE PICK'}
                    </p>
                    <p className={`text-xs md:text-sm font-black ${currentTurn === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
                      GILIRAN {currentTurn === 'blue' ? 'BLUE' : 'RED'} TEAM
                    </p>
                    <p className="mt-1 text-[9px] md:text-[10px] text-gray-500">
                      {phase === 'ban' ? `${banStep + 1}/${banTurns.length} ban` : `${pickStep + 1}/${PICK_TURNS.length} pick`}
                    </p>
                  </>
                ) : (
                  <p className="text-green-400 font-black text-xs md:text-sm">✅ DRAFT SELESAI</p>
                )}
                {winProb && (
                  <div className="mt-1.5 text-xs text-gray-400">
                    <span className="text-blue-400 font-bold">{winProb.blue.toFixed(0)}%</span> vs{' '}
                    <span className="text-red-400 font-bold">{winProb.red.toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {/* Red Bans */}
              <div className="flex gap-1 items-center justify-end">
                <div className="flex gap-0.5 md:gap-1 flex-row-reverse">
                  {redBans.map((h, i) => (
                    <div
                      key={i}
                      className={`relative rounded-full border-2 overflow-hidden flex-shrink-0 ${
                        h ? 'border-red-500/40 w-9 h-9 md:w-11 md:h-11' : 'border-white/10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center'
                      } bg-[#0a0c14]`}
                    >
                      {h ? (
                        <>
                          <Image src={h.head} alt={h.name} fill className="object-cover grayscale brightness-50" unoptimized sizes="44px" />
                          <span className="absolute inset-0 flex items-center justify-center text-red-400 font-black text-[10px]">✕</span>
                        </>
                      ) : (
                        <span className="text-[8px] text-gray-600">B</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[8px] md:text-[9px] font-bold text-red-300 whitespace-nowrap">BANS</p>
              </div>
            </div>
          </div>

          {/* Role Tabs */}
          {phase !== 'done' && (
            <div className="flex gap-1 md:gap-2 mb-3 md:mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`px-2 md:px-3 py-1 rounded-md text-[10px] md:text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedRole === role.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          )}

          {/* Hero Grid OR Done Screen */}
          {phase !== 'done' ? (
            <div className="flex-1 bg-[#13151f] border border-white/5 rounded-lg p-2 md:p-4 overflow-y-auto">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 gap-1.5 md:gap-2">
                {filteredHeroes.map((hero) => (
                  <button
                    key={hero.hero_id}
                    onClick={() => handleHeroClick(hero)}
                    title={hero.name}
                    className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all hover:scale-110 ${
                      selected?.hero_id === hero.hero_id
                        ? 'border-orange-500 ring-2 ring-orange-500/50 scale-110 z-10'
                        : 'border-white/10 hover:border-orange-500/40'
                    }`}
                  >
                    <Image src={hero.head} alt={hero.name} fill className="object-cover" unoptimized sizes="80px" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-[#13151f] border border-green-500/20 rounded-lg p-4 md:p-8 flex flex-col items-center justify-center">
              <p className="text-4xl md:text-5xl mb-3 md:mb-4">🏆</p>
              <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6">DRAFT SELESAI!</h2>
              {winProb && (
                <div className="text-center mb-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-3">Estimasi Probabilitas Menang</p>
                  <div className="flex justify-center gap-6 md:gap-12 mb-4">
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-blue-400">{winProb.blue.toFixed(0)}%</p>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">TIM BIRU</p>
                    </div>
                    <div className="text-gray-600 self-center font-bold text-lg">vs</div>
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-red-400">{winProb.red.toFixed(0)}%</p>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">TIM MERAH</p>
                    </div>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-2 md:h-3 max-w-xs mx-auto">
                    <div className="bg-blue-500" style={{ width: `${winProb.blue}%` }} />
                    <div className="bg-red-500" style={{ width: `${winProb.red}%` }} />
                  </div>
                </div>
              )}
              <button
                onClick={reset}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors active:scale-95 text-sm md:text-base"
              >
                ↺ ULANG DRAFT
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {phase !== 'done' && (
            <div className="flex gap-2 md:gap-3 mt-3 md:mt-4 justify-center md:justify-start">
              <button
                onClick={undo}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 text-xs md:text-sm font-bold rounded-lg transition-colors"
              >
                <SkipBack className="w-3 h-3 md:w-4 md:h-4" /> Undo
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs md:text-sm font-bold rounded-lg transition-colors active:scale-95"
              >
                <RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> Reset
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Team Merah (Red Team Picks) */}
        <div className="flex-shrink-0 w-full lg:w-24 xl:w-28 order-4 lg:order-3">
          <div className="sticky top-20 space-y-1.5 md:space-y-2">
            <p className="text-[9px] md:text-[10px] font-black text-red-400 mb-1.5 text-center">TIM MERAH</p>
            {redPicks.map((h, i) => (
              <div
                key={i}
                className={`relative w-full aspect-square bg-[#13151f] border-2 rounded-lg overflow-hidden flex items-center justify-center transition-all ${
                  h
                    ? 'border-red-500/60'
                    : phase === 'pick' && currentTurn === 'red' && redPicks.findIndex(p => p === null) === i
                    ? 'border-orange-400 animate-pulse'
                    : 'border-white/10'
                }`}
              >
                {h ? (
                  <Image src={h.head} alt={h.name} fill className="object-cover" unoptimized sizes="120px" />
                ) : (
                  <span className="text-[10px] md:text-xs text-gray-700">Pick {i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── POPUP MODAL ────────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#13151f] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center gap-4 p-4 border-b ${
                phase === 'ban'
                  ? 'border-red-500/20 bg-red-500/10'
                  : currentTurn === 'blue'
                  ? 'border-blue-500/20 bg-blue-500/10'
                  : 'border-red-500/20 bg-red-500/10'
              }`}
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500 flex-shrink-0">
                <Image src={selected.head} alt={selected.name} fill className="object-cover" unoptimized sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black truncate">{selected.name}</h3>
                {(() => {
                  const s = ranks.find((r) => r.name === selected.name);
                  return s ? (
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs text-green-400">WR {(s.win_rate * 100).toFixed(1)}%</span>
                      <span className="text-xs text-red-400">BR {(s.ban_rate * 100).toFixed(1)}%</span>
                      <span className="text-xs text-gray-400">UR {(s.use_rate * 100).toFixed(1)}%</span>
                    </div>
                  ) : null;
                })()}
                <p
                  className={`text-xs mt-1 font-bold ${
                    phase === 'ban' ? 'text-red-400' : currentTurn === 'blue' ? 'text-blue-400' : 'text-red-400'
                  }`}
                >
                  {phase === 'ban' ? '🚫 BAN oleh' : '✅ PICK oleh'} TIM {currentTurn.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-full hover:bg-white/10 flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Counter Info */}
            <div className="p-4 min-h-[90px]">
              {counterLoading ? (
                <div className="flex items-center justify-center h-16 text-gray-500 text-sm">Memuat data counter...</div>
              ) : counterData && counterData.counters.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {phase === 'ban' ? 'Counter hero ini' : 'Lemah terhadap'}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {counterData.counters.slice(0, 6).map((c) => (
                      <div key={c.hero_id} className="flex flex-col items-center gap-1">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-red-500/50">
                          <Image src={c.head} alt={c.name} fill className="object-cover" unoptimized sizes="40px" />
                        </div>
                        <span className="text-[9px] text-gray-400 text-center w-10 truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 text-center py-4">Data counter tidak tersedia</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-4 border-t border-white/5">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-sm transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmAction}
                className={`flex-[2] py-2.5 font-black text-sm rounded-xl transition-all active:scale-95 ${
                  phase === 'ban'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : currentTurn === 'blue'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {phase === 'ban' ? `🚫 BAN ${selected.name}` : `✅ PICK ${selected.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}