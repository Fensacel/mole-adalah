'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { HeroListItem } from '@/lib/api';
import { RotateCcw, SkipBack, X } from 'lucide-react';

type Team = 'blue' | 'red';
type Phase = 'setup' | 'ban' | 'pick' | 'done';
type DraftMode = 'standard' | 'custom' | 'tournament';
type Role = 'all' | 'tank' | 'fighter' | 'assassin' | 'mage' | 'support' | 'marksman';
type TeamRoleSlot = 'roam' | 'exp' | 'mid' | 'gold' | 'jungler';
type BanTurn = { team: Team; count: number };
type MetricKey = 'earlyMid' | 'lateGame' | 'damage' | 'survivability' | 'control' | 'push' | 'coordination';
type TeamMetricProfile = Record<MetricKey, number>;

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
  metric: 'cr' | 'pr' | 'hybrid';
}

interface RecommendedBan extends CounterHero {
  score: number;
  threat: number;
  pressure: number;
}

type CounterCache = Record<number, CounterHero[]>;
const BAN_TIER_LABELS: Record<3 | 4 | 5, string> = {
  3: 'EPIC',
  4: 'LEGEND',
  5: 'MYTHIC',
};
const ALT_BAN_STAGE_COUNTS: Record<Exclude<DraftMode, 'standard'>, [number, number]> = {
  custom: [2, 1],
  tournament: [3, 2],
};
const ALT_SEQUENCE_LABELS: Record<Exclude<DraftMode, 'standard'>, string> = {
  custom: 'Ban 2 -> Pick 3 -> Ban 1 -> Pick 2',
  tournament: 'Ban 3 (Alt) -> Pick 3 -> Ban 2 (Alt) -> Pick 2',
};
const METRIC_LABELS: Array<{ key: MetricKey; label: string }> = [
  { key: 'earlyMid', label: 'Early to Mid Game Potential' },
  { key: 'lateGame', label: 'Late Game Potential' },
  { key: 'damage', label: 'Damage Potential' },
  { key: 'survivability', label: 'Survivability' },
  { key: 'control', label: 'Control Ability' },
  { key: 'push', label: 'Push Ability' },
  { key: 'coordination', label: 'Team Coordination' },
];

const ROLE_METRIC_PRESETS: Record<Exclude<Role, 'all'>, TeamMetricProfile> = {
  tank: {
    earlyMid: 6.2,
    lateGame: 6.0,
    damage: 3.9,
    survivability: 8.8,
    control: 8.1,
    push: 4.2,
    coordination: 7.6,
  },
  fighter: {
    earlyMid: 7.0,
    lateGame: 6.8,
    damage: 7.2,
    survivability: 6.8,
    control: 5.6,
    push: 6.7,
    coordination: 6.1,
  },
  assassin: {
    earlyMid: 7.6,
    lateGame: 6.4,
    damage: 8.6,
    survivability: 4.4,
    control: 4.6,
    push: 5.1,
    coordination: 5.0,
  },
  mage: {
    earlyMid: 6.8,
    lateGame: 8.1,
    damage: 8.2,
    survivability: 4.8,
    control: 7.3,
    push: 5.4,
    coordination: 6.7,
  },
  support: {
    earlyMid: 6.3,
    lateGame: 7.0,
    damage: 4.3,
    survivability: 6.0,
    control: 7.5,
    push: 4.2,
    coordination: 8.8,
  },
  marksman: {
    earlyMid: 5.2,
    lateGame: 8.9,
    damage: 8.8,
    survivability: 4.5,
    control: 3.8,
    push: 8.0,
    coordination: 6.0,
  },
};

const NEUTRAL_PROFILE: TeamMetricProfile = {
  earlyMid: 5.8,
  lateGame: 5.8,
  damage: 5.8,
  survivability: 5.8,
  control: 5.8,
  push: 5.8,
  coordination: 5.8,
};

const LINEUP_WEIGHTS: Record<MetricKey, number> = {
  earlyMid: 1.1,
  lateGame: 1.0,
  damage: 1.2,
  survivability: 1.1,
  control: 1.0,
  push: 0.8,
  coordination: 1.2,
};

function clampMetric(value: number) {
  return Math.max(0, Math.min(10, value));
}

function combineProfiles(profiles: TeamMetricProfile[]): TeamMetricProfile {
  if (!profiles.length) return { ...NEUTRAL_PROFILE };

  const combined = { ...NEUTRAL_PROFILE };
  METRIC_LABELS.forEach(({ key }) => {
    const sum = profiles.reduce((acc, profile) => acc + profile[key], 0);
    combined[key] = clampMetric(sum / profiles.length);
  });
  return combined;
}

function getLineupRating(profile: TeamMetricProfile) {
  const totalWeight = Object.values(LINEUP_WEIGHTS).reduce((sum, w) => sum + w, 0);
  const weighted = METRIC_LABELS.reduce((sum, metric) => sum + profile[metric.key] * LINEUP_WEIGHTS[metric.key], 0);
  return clampMetric(weighted / totalWeight);
}

function getHeroRoleProfile(
  hero: HeroListItem,
  roleMap: Record<number, string[]>,
  rankStatsMap: Map<string, RankHero>,
): TeamMetricProfile {
  const roles = (roleMap[hero.hero_id] ?? [])
    .map((role) => normalizeRoleLabel(role))
    .filter((role): role is Exclude<Role, 'all'> => !!role && role !== 'all');

  const roleProfiles = roles.map((role) => ROLE_METRIC_PRESETS[role]);
  const base = combineProfiles(roleProfiles);

  const stat = rankStatsMap.get(hero.name);
  const winRate = stat?.win_rate ?? 0.5;
  const useRate = stat?.use_rate ?? 0;
  const banRate = stat?.ban_rate ?? 0;
  const performanceBoost = (winRate - 0.5) * 8 + useRate * 1.8 - banRate * 0.9;

  return {
    earlyMid: clampMetric(base.earlyMid + performanceBoost * 0.9),
    lateGame: clampMetric(base.lateGame + performanceBoost * 1.0),
    damage: clampMetric(base.damage + performanceBoost * 1.1),
    survivability: clampMetric(base.survivability + performanceBoost * 0.7),
    control: clampMetric(base.control + performanceBoost * 0.75),
    push: clampMetric(base.push + performanceBoost * 0.8),
    coordination: clampMetric(base.coordination + performanceBoost * 0.85),
  };
}

function getCounterPressureAgainst(
  candidateId: number,
  targetPicks: HeroListItem[],
  counterCache: CounterCache,
) {
  return targetPicks.reduce((sum, target) => {
    const counters = counterCache[target.hero_id] ?? [];
    const found = counters.find((counter) => counter.hero_id === candidateId);
    return found ? sum + Math.max(0, found.increase_win_rate) : sum;
  }, 0);
}

function getDirectCounterScore(
  friendlyPicks: HeroListItem[],
  enemyPicks: HeroListItem[],
  counterCache: CounterCache,
) {
  return enemyPicks.reduce((teamScore, enemy) => {
    const counters = counterCache[enemy.hero_id] ?? [];
    const score = friendlyPicks.reduce((sum, hero) => {
      const found = counters.find((counter) => counter.hero_id === hero.hero_id);
      return found ? sum + found.increase_win_rate : sum;
    }, 0);
    return teamScore + score;
  }, 0);
}

function createAlternatingBanTurns(perTeamCount: number, firstTeam: Team = 'blue') {
  const secondTeam: Team = firstTeam === 'blue' ? 'red' : 'blue';
  return Array.from({ length: perTeamCount * 2 }, (_, index) => ({
    team: index % 2 === 0 ? firstTeam : secondTeam,
    count: 1,
  })) as BanTurn[];
}

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

function calcWinProbabilityFromScores(blueScore: number, redScore: number) {
  const safeBlue = Math.max(0.1, blueScore);
  const safeRed = Math.max(0.1, redScore);
  const total = safeBlue + safeRed;
  return {
    blue: (safeBlue / total) * 100,
    red: (safeRed / total) * 100,
  };
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
  const [draftMode, setDraftMode] = useState<DraftMode>('standard');
  const [banCount, setBanCount] = useState<3 | 4 | 5>(3);
  const [phase, setPhase] = useState<Phase>('setup');
  const [banStep, setBanStep]   = useState(0);
  const [pickStep, setPickStep] = useState(0);
  const [customStage, setCustomStage] = useState(0); // 0 ban2, 1 pick3, 2 ban1, 3 pick2
  const [customStageStep, setCustomStageStep] = useState(0);
  const [blueTeamName, setBlueTeamName] = useState('');
  const [redTeamName, setRedTeamName] = useState('');
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
  const customBanTurns = useMemo(() => {
    const stageCounts = draftMode === 'tournament' ? ALT_BAN_STAGE_COUNTS.tournament : ALT_BAN_STAGE_COUNTS.custom;
    const count = stageCounts[customStage === 2 ? 1 : 0] ?? stageCounts[0];

    if (draftMode === 'tournament') {
      return createAlternatingBanTurns(count);
    }

    return [
      { team: 'blue', count },
      { team: 'red', count },
    ] as BanTurn[];
  }, [customStage, draftMode]);
  const activeBanTurns = draftMode === 'standard' ? banTurns : customBanTurns;
  const activeBanStep = draftMode === 'standard' ? banStep : customStageStep;
  const currentBanTurn = activeBanTurns[Math.min(activeBanStep, activeBanTurns.length - 1)];
  const currentTurn: Team = phase === 'ban'
    ? currentBanTurn.team
    : PICK_TURNS[Math.min(pickStep, PICK_TURNS.length - 1)];

  const customPickTarget = customStage === 1 ? 6 : 10;
  const blueTeamLabel = useMemo(() => {
    const base = draftMode === 'tournament' ? blueTeamName.trim() : 'Blue Team';
    return base || 'Blue Team';
  }, [blueTeamName, draftMode]);
  const redTeamLabel = useMemo(() => {
    const base = draftMode === 'tournament' ? redTeamName.trim() : 'Red Team';
    return base || 'Red Team';
  }, [redTeamName, draftMode]);
  const stageLabel = useMemo(() => {
    if (draftMode === 'standard') return null;

    if (customStage === 0) {
      return `Stage 1/4: Ban ${ALT_BAN_STAGE_COUNTS[draftMode][0]}`;
    }
    if (customStage === 1) {
      return 'Stage 2/4: Pick 3';
    }
    if (customStage === 2) {
      return `Stage 3/4: Ban ${ALT_BAN_STAGE_COUNTS[draftMode][1]}`;
    }
    return 'Stage 4/4: Pick 2';
  }, [draftMode, customStage]);

  useEffect(() => {
    let active = true;

    const hydratePickCounters = async () => {
      const pickedHeroes = [...bluePicks, ...redPicks].filter(Boolean) as HeroListItem[];
      if (!pickedHeroes.length) {
        if (active) setRecommendationLoading(false);
        return;
      }

      const uncached = pickedHeroes.filter((hero) => !counterCache[hero.hero_id]);
      if (!uncached.length) {
        if (active) setRecommendationLoading(false);
        return;
      }

      if (active) setRecommendationLoading(true);

      const responses = await Promise.allSettled(
        uncached.map(async (hero) => {
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

    hydratePickCounters();

    return () => {
      active = false;
    };
  }, [bluePicks, redPicks, counterCache]);

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
          const winRate = stat?.win_rate ?? 0;
          const banRate = stat?.ban_rate ?? 0;
          const threatScore = pickRate * 0.6 + winRate * 0.35 - banRate * 0.1;
          return {
            name: hero.name,
            head: hero.head,
            hero_id: hero.hero_id,
            hero_win_rate: winRate,
            increase_win_rate: pickRate,
            score: threatScore,
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
        const stat = rankStatsMap.get(counter.name);
        const winRate = stat?.win_rate ?? counter.hero_win_rate;
        const useRate = stat?.use_rate ?? 0;
        const banRate = stat?.ban_rate ?? 0;
        const hybridScore = counter.increase_win_rate * 0.7 + winRate * 0.2 + useRate * 0.15 - banRate * 0.05;
        const current = aggregated.get(counter.hero_id);
        if (current) {
          current.score += hybridScore;
          current.matches += 1;
        } else {
          aggregated.set(counter.hero_id, {
            ...counter,
            hero_win_rate: winRate,
            score: hybridScore,
            matches: 1,
            metric: 'hybrid',
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
    setCustomStage(0);
    setCustomStageStep(0);
    setSelectedRole('all');
    setHistory([]);
    const effectiveBanCount = draftMode === 'standard' ? banCount : (draftMode === 'custom' ? 3 : 5);
    setBlueBans(createBanSlots(effectiveBanCount));
    setRedBans(createBanSlots(effectiveBanCount));
    setBluePicks([null, null, null, null, null]);
    setRedPicks([null, null, null, null, null]);
    setUsedIds(new Set());
    setSelected(null);
    setCounterCache({});
    setPendingBanSelections([]);
  };

  const applyBanBatch = useCallback((batch: HeroListItem[]) => {
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
      setBlueBans((prev) => {
        const next = [...prev];
        for (const hero of batch) {
          const emptyIndex = next.findIndex((b) => b === null);
          if (emptyIndex >= 0) next[emptyIndex] = hero;
        }
        return next;
      });
    } else {
      setRedBans((prev) => {
        const next = [...prev];
        for (const hero of batch) {
          const emptyIndex = next.findIndex((b) => b === null);
          if (emptyIndex >= 0) next[emptyIndex] = hero;
        }
        return next;
      });
    }

    setPendingBanSelections([]);
    if (draftMode !== 'standard') {
      if (customStageStep + 1 >= activeBanTurns.length) {
        const nextStage = customStage + 1;
        setCustomStage(nextStage);
        setCustomStageStep(0);
        setPhase('pick');
      } else {
        setCustomStageStep((s) => s + 1);
      }
      return;
    }

    if (banStep + 1 >= banTurns.length) setPhase('pick');
    else setBanStep((s) => s + 1);
  }, [banStep, banTurns.length, currentTurn, draftMode, customStage, customStageStep, activeBanTurns.length]);

  useEffect(() => {
    if (phase !== 'ban') return;
    if (pendingBanSelections.length !== currentBanTurn.count) return;
    applyBanBatch(pendingBanSelections);
  }, [phase, pendingBanSelections, currentBanTurn.count, applyBanBatch]);

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

    const isAlreadyPicked = bluePicks.some((h) => h?.hero_id === selected.hero_id)
      || redPicks.some((h) => h?.hero_id === selected.hero_id);
    if (isAlreadyPicked) {
      setSelected(null);
      return;
    }

    const targetPicks = currentTurn === 'blue' ? bluePicks : redPicks;
    const emptyIndex = targetPicks.findIndex((pick) => pick === null);
    if (emptyIndex === -1) {
      setSelected(null);
      return;
    }

    setUsedIds((prev) => {
      const next = new Set(prev);
      next.add(selected.hero_id);
      return next;
    });
    setHistory((prev) => [...prev, { type: 'pick', team: currentTurn, hero: selected }]);

    if (currentTurn === 'blue') {
      setBluePicks((prev) => {
        const next = [...prev];
        const idx = next.findIndex((b) => b === null);
        if (idx === -1) return prev;
        next[idx] = selected;
        return next;
      });
    } else {
      setRedPicks((prev) => {
        const next = [...prev];
        const idx = next.findIndex((b) => b === null);
        if (idx === -1) return prev;
        next[idx] = selected;
        return next;
      });
    }
    const nextPickStep = pickStep + 1;
    if (draftMode !== 'standard') {
      setPickStep(nextPickStep);
      setCustomStageStep((s) => s + 1);

      if (nextPickStep >= customPickTarget) {
        const nextStage = customStage + 1;
        if (nextStage >= 4) {
          setPhase('done');
        } else {
          setCustomStage(nextStage);
          setCustomStageStep(0);
          setPhase(nextStage === 2 ? 'ban' : 'pick');
        }
      }
    } else {
      if (nextPickStep >= PICK_TURNS.length) setPhase('done');
      else setPickStep(nextPickStep);
    }
    setSelected(null);
  };

  const undo = () => {
    if (draftMode !== 'standard') {
      reset();
      return;
    }

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
    setCustomStage(0); setCustomStageStep(0);
    setBlueBans(createBanSlots(banCount)); setRedBans(createBanSlots(banCount));
    setBluePicks([null,null,null,null,null]); setRedPicks([null,null,null,null,null]);
    setUsedIds(new Set()); setSelected(null); setCounterCache({}); setPendingBanSelections([]);
  };

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

  const blueTeamProfile = useMemo(() => {
    const picks = bluePicks.filter(Boolean) as HeroListItem[];
    const profiles = picks.map((hero) => getHeroRoleProfile(hero, roleMap, rankStatsMap));
    return combineProfiles(profiles);
  }, [bluePicks, roleMap, rankStatsMap]);

  const redTeamProfile = useMemo(() => {
    const picks = redPicks.filter(Boolean) as HeroListItem[];
    const profiles = picks.map((hero) => getHeroRoleProfile(hero, roleMap, rankStatsMap));
    return combineProfiles(profiles);
  }, [redPicks, roleMap, rankStatsMap]);

  const blueLineupRating = useMemo(() => getLineupRating(blueTeamProfile), [blueTeamProfile]);
  const redLineupRating = useMemo(() => getLineupRating(redTeamProfile), [redTeamProfile]);

  const counterIndex = useMemo(() => {
    const bluePicked = bluePicks.filter(Boolean) as HeroListItem[];
    const redPicked = redPicks.filter(Boolean) as HeroListItem[];
    if (!bluePicked.length || !redPicked.length) {
      return { blue: 0, red: 0, delta: 0 };
    }

    const blueScoreRaw = getDirectCounterScore(bluePicked, redPicked, counterCache);
    const redScoreRaw = getDirectCounterScore(redPicked, bluePicked, counterCache);
    const pairCount = Math.max(1, bluePicked.length * redPicked.length);

    const blueScore = (blueScoreRaw / pairCount) * 100;
    const redScore = (redScoreRaw / pairCount) * 100;
    const delta = blueScore - redScore;
    return {
      blue: blueScore,
      red: redScore,
      delta,
    };
  }, [bluePicks, redPicks, counterCache]);

  const winProb = useMemo(() => {
    const blueScore = blueLineupRating + bluePickStats.avg * 4 + counterIndex.delta * 0.45;
    const redScore = redLineupRating + redPickStats.avg * 4 - counterIndex.delta * 0.45;
    return calcWinProbabilityFromScores(blueScore, redScore);
  }, [blueLineupRating, redLineupRating, bluePickStats.avg, redPickStats.avg, counterIndex.delta]);

  const projectedWinProb = useMemo(() => {
    if (!selected || phase !== 'pick') return null;

    const bWRs = bluePicks.filter(Boolean).map((h) => rankMap.get(h!.name) ?? 0.5);
    const rWRs = redPicks.filter(Boolean).map((h) => rankMap.get(h!.name) ?? 0.5);
    const selectedRate = rankMap.get(selected.name) ?? 0.5;
    if (currentTurn === 'blue') bWRs.push(selectedRate);
    else rWRs.push(selectedRate);

    return calcWinProbability(bWRs, rWRs);
  }, [selected, phase, bluePicks, redPicks, rankMap, currentTurn]);

  const banRecommendations = useMemo(() => {
    if (phase !== 'ban') return [] as RecommendedBan[];

    const ownPicks = (currentTurn === 'blue' ? bluePicks : redPicks).filter(Boolean) as HeroListItem[];

    return heroes
      .filter((hero) => !usedIds.has(hero.hero_id))
      .filter((hero) => !pendingBanSelections.some((picked) => picked.hero_id === hero.hero_id))
      .map((hero) => {
        const stat = rankStatsMap.get(hero.name);
        const winRate = stat?.win_rate ?? 0;
        const banRate = stat?.ban_rate ?? 0;
        const useRate = stat?.use_rate ?? 0;
        const threat = winRate * 0.45 + banRate * 0.35 + useRate * 0.2;
        const pressure = ownPicks.length ? getCounterPressureAgainst(hero.hero_id, ownPicks, counterCache) : 0;
        const score = threat + pressure * 0.9;

        return {
          name: hero.name,
          head: hero.head,
          hero_id: hero.hero_id,
          hero_win_rate: winRate,
          increase_win_rate: pressure,
          score,
          threat,
          pressure,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.threat !== a.threat) return b.threat - a.threat;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [phase, currentTurn, bluePicks, redPicks, heroes, usedIds, pendingBanSelections, rankStatsMap, counterCache]);

  // ─── SETUP ───────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[#0d0f17] text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-black mb-3">Draft Simulator</h1>
        <p className="text-gray-400 mb-6 text-center max-w-sm text-sm">Set the number of bans first, then choose your team side.</p>
        <div className="w-full max-w-sm mb-6">
          <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 text-center">Mode</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setDraftMode('standard')}
              className={`rounded-xl border px-4 py-2.5 text-xs font-black transition-all ${
                draftMode === 'standard'
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-blue-500/40 hover:bg-white/10'
              }`}
            >
              STANDARD
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftMode('custom');
                setBanCount(3);
              }}
              className={`rounded-xl border px-4 py-2.5 text-xs font-black transition-all ${
                draftMode === 'custom'
                  ? 'border-amber-500 bg-amber-500 text-black'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-amber-500/40 hover:bg-white/10'
              }`}
            >
              CUSTOM
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftMode('tournament');
                setBanCount(5);
              }}
              className={`rounded-xl border px-4 py-2.5 text-xs font-black transition-all ${
                draftMode === 'tournament'
                  ? 'border-emerald-500 bg-emerald-500 text-black'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-emerald-500/40 hover:bg-white/10'
              }`}
            >
              TOURNAMENT
            </button>
          </div>

          <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-2 text-center">Bans per Team</p>
          <div className={`grid gap-2 ${draftMode === 'standard' ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {draftMode !== 'standard' ? (
              <div className={`rounded-xl border px-4 py-3 text-center ${draftMode === 'custom' ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
                <p className={`text-xs font-black tracking-wider ${draftMode === 'custom' ? 'text-amber-200' : 'text-emerald-200'}`}>
                  {draftMode === 'custom' ? 'CUSTOM SEQUENCE' : 'TOURNAMENT SEQUENCE'}
                </p>
                <p className={`mt-1 text-[11px] ${draftMode === 'custom' ? 'text-amber-100/80' : 'text-emerald-100/80'}`}>
                  {ALT_SEQUENCE_LABELS[draftMode]}
                </p>
              </div>
            ) : (
              BAN_OPTIONS.map((option) => (
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
              ))
            )}
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">
            {draftMode === 'custom'
              ? 'Custom flow: 6 bans total, then 10 picks in split phases'
              : draftMode === 'tournament'
              ? 'Tournament flow: 10 bans total, then 10 picks in split phases'
              : `Total ban phase: ${banCount * 2} bans, then 10 picks`}
          </p>

          {draftMode === 'tournament' && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="text-left">
                <p className="text-[10px] font-bold tracking-wider text-blue-300 uppercase mb-1">Blue Team Name</p>
                <input
                  type="text"
                  value={blueTeamName}
                  onChange={(e) => setBlueTeamName(e.target.value)}
                  placeholder="Blue Team"
                  maxLength={24}
                  className="w-full rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-white placeholder:text-blue-200/40 outline-none focus:border-blue-400"
                />
              </label>
              <label className="text-left">
                <p className="text-[10px] font-bold tracking-wider text-red-300 uppercase mb-1">Red Team Name</p>
                <input
                  type="text"
                  value={redTeamName}
                  onChange={(e) => setRedTeamName(e.target.value)}
                  placeholder="Red Team"
                  maxLength={24}
                  className="w-full rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-white placeholder:text-red-200/40 outline-none focus:border-red-400"
                />
              </label>
              <p className="sm:col-span-2 text-[11px] text-gray-500 text-center">
                Match title preview: <span className="text-blue-300 font-semibold">{blueTeamLabel}</span> vs <span className="text-red-300 font-semibold">{redTeamLabel}</span>
              </p>
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-sm">
          <button
            onClick={() => startDraft('blue')}
            className="bg-blue-500/15 border-2 border-blue-400 rounded-xl p-5 hover:bg-blue-500/25 active:scale-95 transition-all"
          >
            <p className="font-black text-lg text-blue-300 mb-1">🔵 {blueTeamLabel}</p>
            <p className="text-xs text-gray-400">First Pick</p>
          </button>
          <button
            onClick={() => startDraft('red')}
            className="bg-red-500/15 border-2 border-red-400 rounded-xl p-5 hover:bg-red-500/25 active:scale-95 transition-all"
          >
            <p className="font-black text-lg text-red-300 mb-1">🔴 {redTeamLabel}</p>
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
            <p className="col-span-5 text-[9px] md:text-[10px] font-black text-blue-400 text-left lg:text-center mb-0.5 lg:mb-1.5 uppercase">{blueTeamLabel}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-2 md:gap-3 items-start">
              {/* Blue Bans */}
              <div className="flex gap-1 items-center justify-between md:justify-start">
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
              <div className="text-center px-1 md:px-2 order-first md:order-none">
                {phase !== 'done' ? (
                  <>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${phase === 'ban' ? 'text-red-400' : 'text-green-400'}`}>
                      {phase === 'ban' ? '🚫 BAN PHASE' : '👤 PICK PHASE'}
                    </p>
                    <p className={`text-xs md:text-sm font-black ${currentTurn === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
                      TURN: {currentTurn === 'blue' ? blueTeamLabel : redTeamLabel}
                    </p>
                    <p className="mt-1 text-[9px] md:text-[10px] text-gray-500">
                      {phase === 'ban'
                        ? `${activeBanStep + 1}/${activeBanTurns.length} ban`
                        : `${pickStep + 1}/${PICK_TURNS.length} pick`}
                    </p>
                    {phase === 'ban' && (
                      <p className="mt-0.5 text-[9px] md:text-[10px] text-red-300">
                        Select {currentBanTurn.count} hero{currentBanTurn.count > 1 ? 'es' : ''} ({pendingBanSelections.length}/{currentBanTurn.count})
                      </p>
                    )}
                    {draftMode !== 'standard' && stageLabel && (
                      <p className="mt-0.5 text-[9px] md:text-[10px] text-amber-300">{stageLabel}</p>
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
                  Note: Win Probability combines WR trend, lineup composition, and counter index. This is still an estimate, not a guaranteed match result.
                </p>
              </div>

              {/* Red Bans */}
              <div className="flex gap-1 items-center justify-between md:justify-end">
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
              <p className="col-span-5 text-[9px] font-black text-red-400 text-left mb-0.5 uppercase">{redTeamLabel}</p>
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

          {phase === 'ban' && (
            <div className="mb-3 md:mb-4 rounded-lg border border-red-500/20 bg-[#1a1115] p-2.5 md:p-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-red-300">
                Recommended Bans {recommendationLoading ? '• Loading...' : ''}
              </p>
              {banRecommendations.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {banRecommendations.map((hero) => (
                    <button
                      key={hero.hero_id}
                      type="button"
                      onClick={() => handleHeroClick(hero)}
                      className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-left transition-colors hover:bg-red-500/20"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-red-400/40">
                        <Image src={hero.head} alt={hero.name} fill className="object-cover" unoptimized sizes="32px" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{hero.name}</p>
                        <p className="text-[10px] text-red-300">
                          Threat {(hero.threat * 100).toFixed(1)}%
                          {hero.pressure > 0 ? ` • Press +${(hero.pressure * 100).toFixed(1)}%` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No ban recommendation available yet.</p>
              )}
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
                            : hero.metric === 'hybrid'
                            ? `Score ${hero.score >= 0 ? '+' : ''}${(hero.score * 100).toFixed(1)}%`
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
              <h2 className="text-xl md:text-2xl font-black mb-2">DRAFT COMPLETE!</h2>
              <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6 uppercase tracking-wide">
                {blueTeamLabel} vs {redTeamLabel}
              </p>
              {winProb && (
                <div className="text-center mb-6 w-full max-w-3xl">
                  <p className="text-gray-400 text-xs md:text-sm mb-3">Estimated Win Probability</p>
                  <div className="flex justify-center gap-6 md:gap-12 mb-4">
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-blue-400">{winProb.blue.toFixed(0)}%</p>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1 uppercase">{blueTeamLabel}</p>
                    </div>
                    <div className="text-gray-600 self-center font-bold text-lg">vs</div>
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-red-400">{winProb.red.toFixed(0)}%</p>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1 uppercase">{redTeamLabel}</p>
                    </div>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-2 md:h-3 max-w-xs mx-auto">
                    <div className="bg-blue-500" style={{ width: `${winProb.blue}%` }} />
                    <div className="bg-red-500" style={{ width: `${winProb.red}%` }} />
                  </div>

                  <div className="mt-5 rounded-xl border border-white/10 bg-[#0f1117] p-3 md:p-4 text-left">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-blue-200/80">{blueTeamLabel}</p>
                        <p className="mt-1 text-[11px] text-blue-100/80">Counter Index</p>
                        <p className="text-xl font-black text-blue-300">{counterIndex.blue.toFixed(1)}</p>
                        <p className="mt-1 text-[11px] text-blue-100/80">Line Up Rating</p>
                        <p className="text-xl font-black text-blue-300">{blueLineupRating.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-red-200/80">{redTeamLabel}</p>
                        <p className="mt-1 text-[11px] text-red-100/80">Counter Index</p>
                        <p className="text-xl font-black text-red-300">{counterIndex.red.toFixed(1)}</p>
                        <p className="mt-1 text-[11px] text-red-100/80">Line Up Rating</p>
                        <p className="text-xl font-black text-red-300">{redLineupRating.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {METRIC_LABELS.map((metric) => {
                        const blueValue = blueTeamProfile[metric.key];
                        const redValue = redTeamProfile[metric.key];
                        const total = Math.max(0.1, blueValue + redValue);
                        const blueWidth = (blueValue / total) * 100;
                        const redWidth = (redValue / total) * 100;

                        return (
                          <div key={metric.key}>
                            <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
                              <span className="text-blue-300">{blueValue.toFixed(2)}</span>
                              <span className="text-gray-200">{metric.label}</span>
                              <span className="text-red-300">{redValue.toFixed(2)}</span>
                            </div>
                            <div className="h-4 overflow-hidden rounded-sm bg-white/10">
                              <div className="flex h-full w-full">
                                <div className="h-full bg-blue-500/80" style={{ width: `${blueWidth}%` }} />
                                <div className="h-full bg-red-500/80" style={{ width: `${redWidth}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs md:text-sm">
                      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-blue-200/80">{blueTeamLabel} Line Up Rating</p>
                        <p className="text-xl font-black text-blue-300 mt-1">{blueLineupRating.toFixed(1)}</p>
                        <p className="text-[10px] text-blue-200/70 mt-1">Avg WR {(bluePickStats.avg * 100).toFixed(1)}%</p>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left">
                        <p className="text-[10px] uppercase tracking-wider text-red-200/80">{redTeamLabel} Line Up Rating</p>
                        <p className="text-xl font-black text-red-300 mt-1">{redLineupRating.toFixed(1)}</p>
                        <p className="text-[10px] text-red-200/70 mt-1">Avg WR {(redPickStats.avg * 100).toFixed(1)}%</p>
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
            <p className="col-span-5 text-[9px] md:text-[10px] font-black text-red-400 text-left lg:text-center mb-0.5 lg:mb-1.5 uppercase">{redTeamLabel}</p>
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
                  {phase === 'ban' ? '🚫 BAN by' : '✅ PICK by'} {currentTurn === 'blue' ? blueTeamLabel : redTeamLabel}
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
                    Predicted advantage: {projectedWinProb.blue >= projectedWinProb.red ? blueTeamLabel : redTeamLabel}
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