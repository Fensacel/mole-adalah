'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { HeroListItem } from '@/lib/api';
import { RotateCcw, SkipBack, X } from 'lucide-react';

type Team = 'blue' | 'red';
type Phase = 'setup' | 'ban' | 'pick' | 'done';
type Role = 'all' | 'tank' | 'fighter' | 'assassin' | 'mage' | 'support' | 'marksman';
type TeamRoleSlot = 'roam' | 'exp' | 'mid' | 'gold' | 'jungler';
type BanTurn = { team: Team; count: number };

const PICK_TURNS: Team[] = ['blue','red','red','blue','blue','red','red','blue','blue','red'];
const BAN_OPTIONS = [3, 4, 5] as const;
const TEAM_ROLE_SLOTS: TeamRoleSlot[] = ['roam', 'exp', 'mid', 'gold', 'jungler'];
const ROLES: { label: string; value: Role }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'TANK', value: 'tank' },
  { label: 'FIGHTER', value: 'fighter' },
  { label: 'ASSASSIN', value: 'assassin' },
  { label: 'MAGE', value: 'mage' },
  { label: 'SUPPORT', value: 'support' },
  { label: 'MARKSMAN', value: 'marksman' },
];

interface RankHero { name: string; hero_id: number; win_rate: number; ban_rate: number; use_rate: number; }
interface CounterHero { name: string; head: string; hero_id: number; hero_win_rate: number; increase_win_rate: number; }
interface RecommendedPick extends CounterHero {
  score: number;
  matches: number;
  metric: 'cr' | 'pr';
}

type CounterCache = Record<number, CounterHero[]>;
const BAN_TIER_LABELS: Record<3 | 4 | 5, string> = {
  3: 'EPIC',
  4: 'LEGEND',
  5: 'MYTHIC',
};

function normalizeRoleLabel(value: string): Role | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (v === 'all') return 'all';
  if (v === 'mm' || v.includes('marksman')) return 'marksman';
  if (v.includes('assassin')) return 'assassin';
  if (v.includes('fighter')) return 'fighter';
  if (v.includes('tank')) return 'tank';
  if (v.includes('mage')) return 'mage';
  if (v.includes('support')) return 'support';
  return null;
}

function calcWinProbability(blueRates: number[], redRates: number[]) {
  if (!blueRates.length && !redRates.length) return null;
  const blueAvg = blueRates.length ? blueRates.reduce((a, b) => a + b, 0) / blueRates.length : 0.5;
  const redAvg = redRates.length ? redRates.reduce((a, b) => a + b, 0) / redRates.length : 0.5;
  const total = blueAvg + redAvg;
  if (total <= 0) return { blue: 50, red: 50 };
  return { blue: (blueAvg / total) * 100, red: (redAvg / total) * 100 };
}

function createBanSlots(count: number) {
  return Array.from({ length: count }, () => null as HeroListItem | null);
}

function getBanPattern(count: 3 | 4 | 5): [number, number] {
  if (count === 3) return [1, 2];
  if (count === 4) return [2, 2];
  return [3, 2];
}

export default function DraftClient({
  heroes,
  ranks,
  roleMap,
}: {
  heroes: HeroListItem[];
  ranks: RankHero[];
  roleMap: Record<number, string[]>;
}) {
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


  const [selected, setSelected] = useState<HeroListItem | null>(null);
  const [counterData, setCounterData] = useState<{ counters: CounterHero[]; worst_matchups: CounterHero[] } | null>(null);
  const [counterLoading, setCounterLoading] = useState(false);
  const [counterCache, setCounterCache] = useState<CounterCache>({});
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [pendingBanSelections, setPendingBanSelections] = useState<HeroListItem[]>([]);

  const rankMap = useMemo(() => new Map(ranks.map((r) => [r.name, r.win_rate])), [ranks]);
  const rankStatsMap = useMemo(() => new Map(ranks.map((r) => [r.name, r])), [ranks]);
  const banTurns = useMemo(() => {
    const [firstRoundCount, secondRoundCount] = getBanPattern(banCount);
    return [
      { team: 'blue', count: firstRoundCount },
      { team: 'red', count: firstRoundCount },
      { team: 'blue', count: secondRoundCount },
      { team: 'red', count: secondRoundCount },
    ] as BanTurn[];
  }, [banCount]);
  const currentBanTurn = banTurns[Math.min(banStep, banTurns.length - 1)];
  const currentTurn: Team = phase === 'ban'
    ? currentBanTurn.team
    : PICK_TURNS[Math.min(pickStep, PICK_TURNS.length - 1)];

  useEffect(() => {
    let active = true;

    const hydrateEnemyCounters = async () => {
      if (phase !== 'pick') {
        if (active) {
          setRecommendationLoading(false);
        }
        return;
      }

      const enemyPicks = (currentTurn === 'blue' ? redPicks : bluePicks).filter(Boolean) as HeroListItem[];
      if (!enemyPicks.length) {
        if (active) {
          setRecommendationLoading(false);
        }
        return;
      }

      const uncachedEnemies = enemyPicks.filter((hero) => !counterCache[hero.hero_id]);
      if (!uncachedEnemies.length) {
        if (active) setRecommendationLoading(false);
        return;
      }

      if (active) setRecommendationLoading(true);

      const responses = await Promise.allSettled(
        uncachedEnemies.map(async (hero) => {
          const res = await fetch(`/api/hero/counter/${encodeURIComponent(hero.name)}`);
          if (!res.ok) return null;
          const data = await res.json() as { counters: CounterHero[] };
          return { heroId: hero.hero_id, counters: data.counters ?? [] };
        }),
      );

      const nextEntries: CounterCache = {};
      for (const result of responses) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        nextEntries[result.value.heroId] = result.value.counters;
      }

      if (!active) return;
      if (Object.keys(nextEntries).length > 0) {
        setCounterCache((prev) => ({ ...prev, ...nextEntries }));
      }
      setRecommendationLoading(false);
    };

    hydrateEnemyCounters();

    return () => {
      active = false;
    };
  }, [phase, currentTurn, bluePicks, redPicks, counterCache]);

  const pickRecommendations = useMemo(() => {
    if (phase !== 'pick') return [] as RecommendedPick[];

    const enemyPicks = (currentTurn === 'blue' ? redPicks : bluePicks).filter(Boolean) as HeroListItem[];
    if (!enemyPicks.length) {
      if (pickStep !== 0) return [] as RecommendedPick[];

      return heroes
        .filter((hero) => !usedIds.has(hero.hero_id))
        .map((hero) => {
          const stat = rankStatsMap.get(hero.name);
          const pickRate = stat?.use_rate ?? 0;
          return {
            name: hero.name,
            head: hero.head,
            hero_id: hero.hero_id,
            hero_win_rate: stat?.win_rate ?? 0,
            increase_win_rate: pickRate,
            score: pickRate,
            matches: 0,
            metric: 'pr' as const,
          };
        })
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.hero_win_rate !== a.hero_win_rate) return b.hero_win_rate - a.hero_win_rate;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8);
    }

    const aggregated = new Map<number, RecommendedPick>();
    for (const enemy of enemyPicks) {
      const counters = counterCache[enemy.hero_id] ?? [];
      for (const counter of counters) {
        if (usedIds.has(counter.hero_id)) continue;
        const current = aggregated.get(counter.hero_id);
        if (current) {
          current.score += counter.increase_win_rate;
          current.matches += 1;
        } else {
          aggregated.set(counter.hero_id, {
            ...counter,
            score: counter.increase_win_rate,
            matches: 1,
            metric: 'cr',
          });
        }
      }
    }

    return Array.from(aggregated.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.matches !== a.matches) return b.matches - a.matches;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [phase, currentTurn, bluePicks, redPicks, counterCache, usedIds, pickStep, heroes, rankStatsMap]);

  // Filter and sort hero pool by role + win rate
  const filteredHeroes = useMemo(() => {
    const base = heroes.filter((hero) => {
      if (usedIds.has(hero.hero_id)) return false;
      if (selectedRole === 'all') return true;
      const roles = (roleMap[hero.hero_id] ?? [])
        .map((role) => normalizeRoleLabel(role))
        .filter((role): role is Exclude<Role, 'all'> => !!role && role !== 'all');
      return roles.includes(selectedRole);
    });

    return base.sort((a, b) => {
      const aWR = rankMap.get(a.name) ?? 0;
      const bWR = rankMap.get(b.name) ?? 0;
      return bWR - aWR;
    });
  }, [heroes, usedIds, selectedRole, roleMap, rankMap]);

  const handleHeroClick = async (hero: HeroListItem) => {
    if (usedIds.has(hero.hero_id)) return;

    if (phase === 'ban') {
      const alreadySelected = pendingBanSelections.some((h) => h.hero_id === hero.hero_id);
      if (alreadySelected) {
        setPendingBanSelections((prev) => prev.filter((h) => h.hero_id !== hero.hero_id));
        return;
      }

      if (pendingBanSelections.length >= currentBanTurn.count) return;
      setPendingBanSelections((prev) => [...prev, hero]);
      return;
    }

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
    void team;
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
    setCounterCache({});
    setPendingBanSelections([]);
  };

  const applyBanBatch = (batch: HeroListItem[]) => {
    if (!batch.length) return;

    setUsedIds((prev) => {
      const next = new Set(prev);
      batch.forEach((hero) => next.add(hero.hero_id));
      return next;
    });

    setHistory((prev) => [
      ...prev,
      ...batch.map((hero) => ({ type: 'ban' as const, team: currentTurn, hero })),
    ]);

    if (currentTurn === 'blue') {
      const next = [...blueBans];
      for (const hero of batch) {
        const emptyIndex = next.findIndex((b) => b === null);
        if (emptyIndex >= 0) next[emptyIndex] = hero;
      }
      setBlueBans(next);
    } else {
      const next = [...redBans];
      for (const hero of batch) {
        const emptyIndex = next.findIndex((b) => b === null);
        if (emptyIndex >= 0) next[emptyIndex] = hero;
      }
      setRedBans(next);
    }

    setPendingBanSelections([]);
    if (banStep + 1 >= banTurns.length) setPhase('pick');
    else setBanStep((s) => s + 1);
  };

  useEffect(() => {
    if (phase !== 'ban') return;
    if (pendingBanSelections.length !== currentBanTurn.count) return;
    applyBanBatch(pendingBanSelections);
  }, [phase, pendingBanSelections, currentBanTurn.count]);

  const confirmBanBatch = () => {
    if (phase !== 'ban') return;
    if (pendingBanSelections.length !== currentBanTurn.count) return;

    applyBanBatch(pendingBanSelections);
  };

  const confirmAction = () => {
    if (phase === 'ban') {
      confirmBanBatch();
      return;
    }

    if (!selected) return;
    const newUsedIds = new Set([...usedIds, selected.hero_id]);
    setUsedIds(newUsedIds);
    setHistory([...history, { type: 'pick', team: currentTurn, hero: selected }]);

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
      setPendingBanSelections([]);
      if (last.team === 'blue') setBlueBans((b) => b.map((h) => h?.hero_id === last.hero.hero_id ? null : h));
      else setRedBans((r) => r.map((h) => h?.hero_id === last.hero.hero_id ? null : h));
      if (phase !== 'ban') {
        setPhase('ban');
        setBanStep(Math.max(0, banTurns.length - 1));
        setPickStep(0);
      } else {
        setBanStep(h => Math.max(0, h - 1));
      }
    } else {
      if (last.team === 'blue') setBluePicks((p) => p.map((h) => h?.hero_id === last.hero.hero_id ? null : h));
      else setRedPicks((p) => p.map((h) => h?.hero_id === last.hero.hero_id ? null : h));
      if (phase === 'done') {
        setPhase('pick');
        setPickStep(PICK_TURNS.length - 1);
      } else {
        setPickStep(s => Math.max(0, s - 1));
      }
    }
  };

  const reset = () => {
    setPhase('setup'); setBanStep(0); setPickStep(0); setSelectedRole('all'); setHistory([]);
    setBlueBans(createBanSlots(banCount)); setRedBans(createBanSlots(banCount));
    setBluePicks([null,null,null,null,null]); setRedPicks([null,null,null,null,null]);
    setUsedIds(new Set()); setSelected(null); setCounterCache({}); setPendingBanSelections([]);
  };

  const winProb = (() => {
    const bWRs = bluePicks.filter(Boolean).map(h => rankMap.get(h!.name) ?? 0.5);
    const rWRs = redPicks.filter(Boolean).map(h => rankMap.get(h!.name) ?? 0.5);
    return calcWinProbability(bWRs, rWRs);
  })();

  const projectedWinProb = (() => {
    if (!selected || phase !== 'pick') return null;
    const bWRs = bluePicks.filter(Boolean).map(h => rankMap.get(h!.name) ?? 0.5);
    const rWRs = redPicks.filter(Boolean).map(h => rankMap.get(h!.name) ?? 0.5);
    const selectedRate = rankMap.get(selected.name) ?? 0.5;
    if (currentTurn === 'blue') bWRs.push(selectedRate);
    else rWRs.push(selectedRate);
    return calcWinProbability(bWRs, rWRs);
  })();

  const bluePickStats = useMemo(() => {
    const picks = bluePicks.filter(Boolean) as HeroListItem[];
    const rates = picks.map((hero) => ({ hero, rate: rankMap.get(hero.name) ?? 0.5 }));
    const avg = rates.length ? rates.reduce((sum, item) => sum + item.rate, 0) / rates.length : 0.5;
    return { rates, avg };
  }, [bluePicks, rankMap]);

  const redPickStats = useMemo(() => {
    const picks = redPicks.filter(Boolean) as HeroListItem[];
    const rates = picks.map((hero) => ({ hero, rate: rankMap.get(hero.name) ?? 0.5 }));
    const avg = rates.length ? rates.reduce((sum, item) => sum + item.rate, 0) / rates.length : 0.5;
    return { rates, avg };
  }, [redPicks, rankMap]);

  // ─── SETUP ───────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[#0d0f17] text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-black mb-3">Draft Simulator</h1>
        <p className="text-gray-400 mb-6 text-center max-w-sm text-sm">Set the number of bans first, then choose your team side.</p>
        <div className="w-full max-w-sm mb-6">
          <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 text-center">Bans per Team</p>
          <div className="grid grid-cols-3 gap-2">
            {BAN_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBanCount(option)}
                className={`rounded-xl border px-4 py-3 text-sm font-black transition-all ${
                  banCount === option
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-blue-500/40 hover:bg-white/10'
                }`}
              >
                <span className="block text-xs tracking-wider text-white/80">{BAN_TIER_LABELS[option]}</span>
                <span className="block mt-0.5">{option} Bans</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">Total ban phase: {banCount * 2} bans, then 10 picks</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-sm">
          <button
            onClick={() => startDraft('blue')}
            className="bg-blue-500/15 border-2 border-blue-400 rounded-xl p-5 hover:bg-blue-500/25 active:scale-95 transition-all"
          >
            <p className="font-black text-lg text-blue-300 mb-1">🔵 Blue Team</p>
            <p className="text-xs text-gray-400">First Pick</p>
          </button>
          <button
            onClick={() => startDraft('red')}
            className="bg-red-500/15 border-2 border-red-400 rounded-xl p-5 hover:bg-red-500/25 active:scale-95 transition-all"
          >
            <p className="font-black text-lg text-red-300 mb-1">🔴 Red Team</p>
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
      <div className="max-w-[1400px] mx-auto px-2 md:px-4 py-3 md:py-4 min-h-screen flex flex-col lg:flex-row gap-3 md:gap-4">
        
        {/* LEFT PANEL - Blue Team Picks */}
        <div className="flex-shrink-0 w-full lg:w-24 xl:w-28 order-1 lg:order-1">
          <div className="grid grid-cols-5 gap-1.5 md:gap-2 lg:block lg:space-y-1.5 xl:space-y-2 lg:sticky lg:top-20">
            <p className="col-span-5 text-[9px] md:text-[10px] font-black text-blue-400 text-left lg:text-center mb-0.5 lg:mb-1.5">BLUE TEAM</p>
            {bluePicks.map((h, i) => (
              <div
                key={i}
                className={`relative w-full aspect-square bg-[#13151f] border rounded-lg overflow-hidden flex items-center justify-center transition-all ${
                  h
                    ? 'border-blue-500/60'
                    : phase === 'pick' && currentTurn === 'blue' && bluePicks.findIndex(p => p === null) === i
                    ? 'border-blue-400 animate-pulse'
                    : 'border-white/10'
                }`}
              >
                {h ? (
                  <Image src={h.head} alt={h.name} fill className="object-cover" unoptimized sizes="120px" />
                ) : (
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-gray-600">{TEAM_ROLE_SLOTS[i]}</span>
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
                      {phase === 'ban' ? '🚫 BAN PHASE' : '👤 PICK PHASE'}
                    </p>
                    <p className={`text-xs md:text-sm font-black ${currentTurn === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
                      TURN: {currentTurn === 'blue' ? 'BLUE' : 'RED'} TEAM
                    </p>
                    <p className="mt-1 text-[9px] md:text-[10px] text-gray-500">
                      {phase === 'ban' ? `${banStep + 1}/${banTurns.length} ban` : `${pickStep + 1}/${PICK_TURNS.length} pick`}
                    </p>
                    {phase === 'ban' && (
                      <p className="mt-0.5 text-[9px] md:text-[10px] text-red-300">
                        Select {currentBanTurn.count} hero{currentBanTurn.count > 1 ? 'es' : ''} ({pendingBanSelections.length}/{currentBanTurn.count})
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-green-400 font-black text-xs md:text-sm">✅ DRAFT COMPLETE</p>
                )}
                {winProb && (
                  <div className="mt-1.5 text-xs text-gray-400">
                    <span className="text-blue-400 font-bold">{winProb.blue.toFixed(0)}%</span> vs{' '}
                    <span className="text-red-400 font-bold">{winProb.red.toFixed(0)}%</span>
                    <span className="ml-2 text-[10px] text-gray-500">
                      Advantage: {winProb.blue >= winProb.red ? 'Blue' : 'Red'}
                    </span>
                  </div>
                )}
                <p className="mt-1 text-[9px] md:text-[10px] text-gray-500 leading-relaxed">
                  Note: Win Probability is an estimate based on selected hero WR data, not a guaranteed match result.
                </p>
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

          {/* Mobile RED TEAM panel (directly below bans/status) */}
          <div className="lg:hidden mb-3">
            <div className="grid grid-cols-5 gap-1.5">
              <p className="col-span-5 text-[9px] font-black text-red-400 text-left mb-0.5">RED TEAM</p>
              {redPicks.map((h, i) => (
                <div
                  key={i}
                  className={`relative w-full aspect-square bg-[#13151f] border rounded-lg overflow-hidden flex items-center justify-center transition-all ${
                    h
                      ? 'border-red-500/60'
                      : phase === 'pick' && currentTurn === 'red' && redPicks.findIndex((p) => p === null) === i
                      ? 'border-blue-400 animate-pulse'
                      : 'border-white/10'
                  }`}
                >
                  {h ? (
                    <Image src={h.head} alt={h.name} fill className="object-cover" unoptimized sizes="120px" />
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-gray-600">{TEAM_ROLE_SLOTS[i]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Role Tabs */}
          {phase !== 'done' && (
            <div>
              <div className="mb-2 text-[10px] text-gray-500 uppercase tracking-wider">
                Active role filter: <span className="text-gray-300 font-bold">{selectedRole === 'all' ? 'All' : selectedRole}</span>
                <span className="ml-2">Pool: {filteredHeroes.length} heroes</span>
              </div>
              <div className="flex gap-1 md:gap-2 mb-3 md:mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`px-2 md:px-3 py-1 rounded-md text-[10px] md:text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedRole === role.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {role.label}
                </button>
              ))}
              </div>
            </div>
          )}

          {phase === 'pick' && (
            <div className="mb-3 md:mb-4 rounded-lg border border-white/10 bg-[#0f1420] p-2.5 md:p-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">
                {pickStep === 0 ? 'Recommended First Picks (High Pick Rate)' : 'Recommended Picks'} {recommendationLoading ? '• Loading...' : ''}
              </p>
              {pickRecommendations.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {pickRecommendations.map((hero) => (
                    <button
                      key={hero.hero_id}
                      type="button"
                      onClick={() => handleHeroClick(hero)}
                      className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-left transition-colors hover:bg-blue-500/20"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-blue-400/30">
                        <Image src={hero.head} alt={hero.name} fill className="object-cover" unoptimized sizes="32px" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{hero.name}</p>
                        <p className={`text-[10px] ${hero.metric === 'pr' ? 'text-blue-300' : hero.score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {hero.metric === 'pr'
                            ? `PR ${(hero.score * 100).toFixed(1)}%`
                            : `CR ${hero.score >= 0 ? '+' : ''}${(hero.score * 100).toFixed(1)}%`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No recommendation available yet.</p>
              )}
            </div>
          )}

          {/* Hero Grid OR Done Screen */}
          {phase !== 'done' ? (
            <div className="flex-1 bg-[#13151f] border border-white/5 rounded-lg p-2 md:p-4 overflow-y-auto">
              {filteredHeroes.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 gap-2 md:gap-2">
                  {filteredHeroes.map((hero) => (
                    <button
                      key={hero.hero_id}
                      onClick={() => handleHeroClick(hero)}
                      title={hero.name}
                      className={`relative rounded-lg md:rounded-full aspect-square overflow-hidden border transition-all hover:scale-110 ${
                        phase === 'ban' && pendingBanSelections.some((h) => h.hero_id === hero.hero_id)
                          ? 'border-red-500 ring-2 ring-red-500/60 scale-105 z-10'
                          : selected?.hero_id === hero.hero_id
                          ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110 z-10'
                          : 'border-white/10 hover:border-blue-500/40'
                      }`}
                    >
                      <Image src={hero.head} alt={hero.name} fill className="object-cover" unoptimized sizes="80px" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full min-h-[220px] flex items-center justify-center text-center text-gray-500 text-sm">
                  No heroes left for this role. Try another role.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-[#13151f] border border-green-500/20 rounded-lg p-4 md:p-8 flex flex-col items-center justify-center">
              <p className="text-4xl md:text-5xl mb-3 md:mb-4">🏆</p>
              <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6">DRAFT COMPLETE!</h2>
              {winProb && (
                <div className="text-center mb-6 w-full max-w-3xl">
                  <p className="text-gray-400 text-xs md:text-sm mb-3">Estimated Win Probability</p>
                  <div className="flex justify-center gap-6 md:gap-12 mb-4">
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-blue-400">{winProb.blue.toFixed(0)}%</p>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">BLUE TEAM</p>
                    </div>
                    <div className="text-gray-600 self-center font-bold text-lg">vs</div>
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-red-400">{winProb.red.toFixed(0)}%</p>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">RED TEAM</p>
                    </div>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-2 md:h-3 max-w-xs mx-auto">
                    <div className="bg-blue-500" style={{ width: `${winProb.blue}%` }} />
                    <div className="bg-red-500" style={{ width: `${winProb.red}%` }} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs md:text-sm">
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-left">
                      <p className="text-[10px] uppercase tracking-wider text-blue-200/80">Blue Team Avg WR</p>
                      <p className="text-xl font-black text-blue-300 mt-1">{(bluePickStats.avg * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left">
                      <p className="text-[10px] uppercase tracking-wider text-red-200/80">Red Team Avg WR</p>
                      <p className="text-xl font-black text-red-300 mt-1">{(redPickStats.avg * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-3 text-left">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Blue Pick Contribution</p>
                      <div className="space-y-1.5">
                        {bluePickStats.rates.map((item) => (
                          <div key={item.hero.hero_id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-300 truncate pr-2">{item.hero.name}</span>
                            <span className="text-blue-300 font-bold">{(item.rate * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Red Pick Contribution</p>
                      <div className="space-y-1.5">
                        {redPickStats.rates.map((item) => (
                          <div key={item.hero.hero_id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-300 truncate pr-2">{item.hero.name}</span>
                            <span className="text-red-300 font-bold">{(item.rate * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={reset}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors active:scale-95 text-sm md:text-base"
              >
                ↺ RESTART DRAFT
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {phase !== 'done' && (
            <div className="flex gap-2 md:gap-3 mt-3 md:mt-4 justify-center md:justify-start">
              {phase === 'ban' && (
                <button
                  onClick={confirmBanBatch}
                  disabled={pendingBanSelections.length !== currentBanTurn.count}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs md:text-sm font-bold rounded-lg transition-colors"
                >
                  Ban Selected ({pendingBanSelections.length}/{currentBanTurn.count})
                </button>
              )}
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

        {/* RIGHT PANEL - Red Team Picks */}
        <div className="hidden lg:block flex-shrink-0 w-full lg:w-24 xl:w-28 order-3 lg:order-3">
          <div className="grid grid-cols-5 gap-1.5 md:gap-2 lg:block lg:space-y-1.5 xl:space-y-2 lg:sticky lg:top-20">
            <p className="col-span-5 text-[9px] md:text-[10px] font-black text-red-400 text-left lg:text-center mb-0.5 lg:mb-1.5">RED TEAM</p>
            {redPicks.map((h, i) => (
              <div
                key={i}
                className={`relative w-full aspect-square bg-[#13151f] border rounded-lg overflow-hidden flex items-center justify-center transition-all ${
                  h
                    ? 'border-red-500/60'
                    : phase === 'pick' && currentTurn === 'red' && redPicks.findIndex(p => p === null) === i
                    ? 'border-blue-400 animate-pulse'
                    : 'border-white/10'
                }`}
              >
                {h ? (
                  <Image src={h.head} alt={h.name} fill className="object-cover" unoptimized sizes="120px" />
                ) : (
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-gray-600">{TEAM_ROLE_SLOTS[i]}</span>
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
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 flex-shrink-0">
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
                  {phase === 'ban' ? '🚫 BAN by' : '✅ PICK by'} {currentTurn.toUpperCase()} TEAM
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
              <div className="mb-3 rounded-md border border-white/10 bg-black/20 px-2.5 py-2">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Note: Counter Rate (CR) comes from hero-counter API matchup stats. A value of <span className="text-gray-300">+CR</span> means stronger against this hero, while <span className="text-gray-300">-CR</span> means weaker.
                </p>
              </div>

              {counterLoading ? (
                <div className="flex items-center justify-center h-16 text-gray-500 text-sm">Loading counter data...</div>
              ) : counterData ? (
                (() => {
                  const matchupList = phase === 'ban'
                    ? counterData.counters
                    : (counterData.worst_matchups?.length
                        ? counterData.worst_matchups
                        : counterData.counters.filter((c) => c.increase_win_rate < 0));

                  if (!matchupList.length) {
                    return <p className="text-xs text-gray-600 text-center py-4">Counter data unavailable</p>;
                  }

                  return (
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {phase === 'ban' ? 'Counters to this hero' : 'Weak Against'}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {matchupList.slice(0, 6).map((c) => (
                          <div key={c.hero_id} className="flex flex-col items-center gap-1">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-red-500/50">
                              <Image src={c.head} alt={c.name} fill className="object-cover" unoptimized sizes="40px" />
                            </div>
                            <span className="text-[9px] text-gray-400 text-center w-12 truncate">{c.name}</span>
                            <span className={`text-[9px] font-bold ${c.increase_win_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              CR {c.increase_win_rate >= 0 ? '+' : ''}{(c.increase_win_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-gray-600 text-center py-4">Counter data unavailable</p>
              )}

              {projectedWinProb && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">If picked now</p>
                  <p className="text-xs text-gray-300">
                    Win Probability: <span className="text-blue-400 font-bold">Blue {projectedWinProb.blue.toFixed(0)}%</span> vs{' '}
                    <span className="text-red-400 font-bold">Red {projectedWinProb.red.toFixed(0)}%</span>
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Predicted advantage: {projectedWinProb.blue >= projectedWinProb.red ? 'Blue Team' : 'Red Team'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-4 border-t border-white/5">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-sm transition-all"
              >
                Cancel
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