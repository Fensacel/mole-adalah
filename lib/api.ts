const BASE_URL = "https://mlbb-stats.rone.dev/api";

export interface HeroListItem {
  name: string;
  head: string;
  hero_id: number;
}

export interface HeroRate {
  win_rate: number;
  ban_rate: number;
  app_rate: number;
  date: string;
}

export interface SubHero {
  name: string;
  head: string;
  hero_id: number;
  hero_win_rate: number;
  hero_appearance_rate: number;
  increase_win_rate: number;
}

export interface HeroCounterData {
  main_hero_win_rate: number;
  main_hero_ban_rate: number;
  main_hero_appearance_rate: number;
  main_hero_name: string;
  main_hero_head: string;
  main_heroid: number;
  counters: SubHero[];
  worst_matchups: SubHero[];
}

export interface HeroCompatibilityData {
  main_hero_win_rate: number;
  main_hero_ban_rate: number;
  main_hero_appearance_rate: number;
  main_hero_name: string;
  main_hero_head: string;
  main_heroid: number;
  best_synergies: SubHero[];
  worst_synergies: SubHero[];
}

export interface HeroDetail {
  name: string;
  head: string;
  hero_id: number;
  role: string[];
  lane: string[];
  specialty: string[];
  story: string;
  painting: string;
}

export interface HeroDetailStat {
  label: string;
  value: string;
}

export interface HeroSkillIcon {
  skill_id: number;
  skill_icon: string;
}

export interface HeroSkillCombo {
  title: string;
  description: string;
  skills: HeroSkillIcon[];
}

export interface HeroRelationData {
  assist: HeroListItem[];
  strong: HeroListItem[];
  weak: HeroListItem[];
}

async function fetchAPI<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getHeroParamVariants(name: string): string[] {
  const raw = name.trim();
  if (!raw) return [];

  const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hyphen = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return [...new Set([raw, compact, hyphen].filter((value) => value.length > 0))];
}

async function fetchHeroAPI<T>(baseEndpoint: string, name: string): Promise<T | null> {
  const variants = getHeroParamVariants(name);
  if (!variants.length) return null;

  for (const variant of variants) {
    const data = await fetchAPI<T>(`${baseEndpoint}/${encodeURIComponent(variant)}/`);
    if (data) return data;
  }

  return null;
}

export async function getAllHeroes(): Promise<HeroListItem[]> {
  const data = await fetchAPI<{ data: { records: Array<{ data: { hero: { data: { name: string; head: string } }; hero_id: number } }> } }>("/hero-list/");
  if (!data) return [];
  return data.data.records
    .map((r) => ({
      name: r.data.hero.data.name,
      head: r.data.hero.data.head,
      hero_id: r.data.hero_id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getHeroRate(name: string): Promise<HeroRate | null> {
  const data = await fetchHeroAPI<{
    data: {
      records: Array<{
        data: {
          win_rate: Array<{ win_rate: number; ban_rate: number; app_rate: number; date: string }>;
        };
      }>;
    };
  }>("/hero-rate", name);
  if (!data || !data.data.records.length) return null;
  const latest = data.data.records[0].data.win_rate;
  if (!latest || !latest.length) return null;
  // Find the most recent valid entry
  const sorted = [...latest].sort((a, b) => b.date.localeCompare(a.date));
  const valid = sorted.find((r) => r.win_rate > 0);
  return valid || sorted[0];
}

export async function getHeroCounter(name: string): Promise<HeroCounterData | null> {
  const data = await fetchHeroAPI<{
    data: {
      records: Array<{
        data: {
          main_hero: { data: { head: string; name: string } };
          main_hero_win_rate: number;
          main_hero_ban_rate: number;
          main_hero_appearance_rate: number;
          main_heroid: number;
          sub_hero: Array<{
            hero: { data: { head: string } };
            heroid: number;
            hero_win_rate: number;
            hero_appearance_rate: number;
            increase_win_rate: number;
          }>;
          sub_hero_last: Array<{
            hero: { data: { head: string } };
            heroid: number;
            hero_win_rate: number;
            hero_appearance_rate: number;
            increase_win_rate: number;
          }>;
        };
      }>;
    };
  }>("/hero-counter", name);

  if (!data || !data.data.records.length) return null;
  const rec = data.data.records[0].data;

  // We need hero names — build a map from hero-list
  const allHeroes = await getAllHeroes();
  const heroMap = new Map(allHeroes.map((h) => [h.hero_id, h]));

  const mapSubHero = (s: { hero: { data: { head: string } }; heroid: number; hero_win_rate: number; hero_appearance_rate: number; increase_win_rate: number }): SubHero => ({
    name: heroMap.get(s.heroid)?.name ?? `Hero #${s.heroid}`,
    head: s.hero.data.head,
    hero_id: s.heroid,
    hero_win_rate: s.hero_win_rate,
    hero_appearance_rate: s.hero_appearance_rate,
    increase_win_rate: s.increase_win_rate,
  });

  return {
    main_hero_win_rate: rec.main_hero_win_rate,
    main_hero_ban_rate: rec.main_hero_ban_rate,
    main_hero_appearance_rate: rec.main_hero_appearance_rate,
    main_hero_name: rec.main_hero.data.name,
    main_hero_head: rec.main_hero.data.head,
    main_heroid: rec.main_heroid,
    counters: (rec.sub_hero || []).map(mapSubHero),
    worst_matchups: (rec.sub_hero_last || []).map(mapSubHero),
  };
}

export async function getHeroCompatibility(name: string): Promise<HeroCompatibilityData | null> {
  const data = await fetchHeroAPI<{
    data: {
      records: Array<{
        data: {
          main_hero: { data: { head: string; name: string } };
          main_hero_win_rate: number;
          main_hero_ban_rate: number;
          main_hero_appearance_rate: number;
          main_heroid: number;
          sub_hero: Array<{
            hero: { data: { head: string } };
            heroid: number;
            hero_win_rate: number;
            hero_appearance_rate: number;
            increase_win_rate: number;
          }>;
          sub_hero_last: Array<{
            hero: { data: { head: string } };
            heroid: number;
            hero_win_rate: number;
            hero_appearance_rate: number;
            increase_win_rate: number;
          }>;
        };
      }>;
    };
  }>("/hero-compatibility", name);

  if (!data || !data.data.records.length) return null;
  const rec = data.data.records[0].data;

  const allHeroes = await getAllHeroes();
  const heroMap = new Map(allHeroes.map((h) => [h.hero_id, h]));

  const mapSubHero = (s: { hero: { data: { head: string } }; heroid: number; hero_win_rate: number; hero_appearance_rate: number; increase_win_rate: number }): SubHero => ({
    name: heroMap.get(s.heroid)?.name ?? `Hero #${s.heroid}`,
    head: s.hero.data.head,
    hero_id: s.heroid,
    hero_win_rate: s.hero_win_rate,
    hero_appearance_rate: s.hero_appearance_rate,
    increase_win_rate: s.increase_win_rate,
  });

  return {
    main_hero_win_rate: rec.main_hero_win_rate,
    main_hero_ban_rate: rec.main_hero_ban_rate,
    main_hero_appearance_rate: rec.main_hero_appearance_rate,
    main_hero_name: rec.main_hero.data.name,
    main_hero_head: rec.main_hero.data.head,
    main_heroid: rec.main_heroid,
    best_synergies: (rec.sub_hero || []).map(mapSubHero),
    worst_synergies: (rec.sub_hero_last || []).map(mapSubHero),
  };
}

export async function getHeroDetail(name: string): Promise<HeroDetail | null> {
  const data = await fetchHeroAPI<{
    data: {
      records: Array<{
        data: {
          hero: {
            data: {
              name: string;
              head: string;
              painting: string;
              sortlabel: string[];
              roadsortlabel: string[];
              speciality: string[];
              story: string;
              heroid: number;
            };
          };
          hero_id: number;
        };
      }>;
    };
  }>("/hero-detail", name);

  if (!data || !data.data.records.length) return null;
  const rec = data.data.records[0].data;
  const hero = rec.hero.data;

  return {
    name: hero.name,
    head: hero.head,
    hero_id: rec.hero_id,
    role: hero.sortlabel?.filter(Boolean) ?? [],
    lane: hero.roadsortlabel?.filter(Boolean) ?? [],
    specialty: hero.speciality?.filter(Boolean) ?? [],
    story: hero.story ?? "",
    painting: hero.painting ?? "",
  };
}

export async function getHeroRank(): Promise<Array<{ name: string; head: string; hero_id: number; win_rate: number; ban_rate: number; use_rate: number }>> {
  const data = await fetchAPI<{
    data: {
      records: Array<{
        data: {
          main_hero: { data: { head: string; name: string } };
          main_heroid: number;
          main_hero_win_rate: number;
          main_hero_ban_rate: number;
          main_hero_appearance_rate: number;
        };
      }>;
    };
  }>("/hero-rank/");

  if (!data) return [];
  return data.data.records.map((r) => ({
    name: r.data.main_hero.data.name,
    head: r.data.main_hero.data.head,
    hero_id: r.data.main_heroid,
    win_rate: r.data.main_hero_win_rate,
    ban_rate: r.data.main_hero_ban_rate,
    use_rate: r.data.main_hero_appearance_rate,
  }));
}

export async function getHeroPosition(): Promise<Array<{ hero_id: number; roles: string[] }>> {
  const data = await fetchAPI<{
    data?: {
      records?: Array<{
        data?: Record<string, unknown>;
      }>;
    };
  }>("/hero-position/");

  if (!data?.data?.records?.length) return [];

  const positions: Array<{ hero_id: number; roles: string[] }> = [];

  for (const record of data.data.records) {
    const raw = record.data ?? {};
    const heroNested = (raw.hero as { data?: Record<string, unknown> } | undefined)?.data ?? {};
    const nestedSortId = Array.isArray(heroNested.sortid)
      ? heroNested.sortid
          .map((entry) => {
            if (entry && typeof entry === "object") {
              const data = (entry as { data?: Record<string, unknown> }).data;
              return typeof data?.sort_title === "string" ? data.sort_title : null;
            }
            return null;
          })
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    const rawSortId = Array.isArray(raw.sortid)
      ? raw.sortid
          .map((entry) => {
            if (entry && typeof entry === "object") {
              const data = (entry as { data?: Record<string, unknown> }).data;
              return typeof data?.sort_title === "string" ? data.sort_title : null;
            }
            return null;
          })
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];

    const heroIdCandidates = [
      raw.hero_id,
      raw.heroid,
      raw.main_heroid,
      (raw.hero as { heroid?: unknown } | undefined)?.heroid,
      heroNested.heroid,
      heroNested.hero_id,
    ];
    const heroId = heroIdCandidates.find((value): value is number => typeof value === "number");

    const roleCandidates = [
      raw.role,
      raw.roles,
      raw.position,
      raw.positions,
      raw.sortlabel,
      raw.hero_position,
      heroNested.sortlabel,
      heroNested.role,
      heroNested.roles,
      heroNested.position,
      nestedSortId,
      rawSortId,
    ];

    const roles = roleCandidates
      .flatMap((value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") return value.split(/[\/,&|]+/g).map((v) => v.trim());
        return [];
      })
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map((value) => normalizeRoleLabel(value))
      .filter((value): value is string => value !== null);

    if (typeof heroId === "number") {
      positions.push({ hero_id: heroId, roles: [...new Set(roles)] });
    }
  }

  return positions;
}

function normalizeRoleLabel(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  if (value === "mm" || value.includes("marksman")) return "Marksman";
  if (value.includes("assassin")) return "Assassin";
  if (value.includes("fighter")) return "Fighter";
  if (value.includes("tank")) return "Tank";
  if (value.includes("mage")) return "Mage";
  if (value.includes("support")) return "Support";

  return null;
}

function normalizeHeroIdList(input: unknown): number[] {
  if (Array.isArray(input)) {
    return input
      .map((value) => (typeof value === "number" ? value : Number(value)))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  if (typeof input === "string") {
    return input
      .split(/[\s,|/]+/g)
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  return [];
}

export async function getHeroSkillCombo(name: string): Promise<HeroSkillCombo[]> {
  const data = await fetchHeroAPI<{
    data?: {
      records?: Array<{
        data?: {
          title?: string;
          desc?: string;
          skill_id?: Array<{
            data?: {
              skillid?: number;
              skillicon?: string;
            };
          }>;
        };
      }>;
    };
  }>("/hero-skill-combo", name);

  const records = data?.data?.records ?? [];
  return records
    .map((record) => {
      const skillData = record.data;
      if (!skillData) return null;

      const skills = (skillData.skill_id ?? [])
        .map((skill) => ({
          skill_id: skill.data?.skillid ?? 0,
          skill_icon: skill.data?.skillicon ?? "",
        }))
        .filter((skill) => skill.skill_id > 0 && skill.skill_icon.length > 0);

      return {
        title: skillData.title?.trim() || "Skill Combo",
        description: skillData.desc?.trim() || "",
        skills,
      } as HeroSkillCombo;
    })
    .filter((entry): entry is HeroSkillCombo => !!entry && entry.skills.length > 0);
}

export async function getHeroRelation(name: string): Promise<HeroRelationData | null> {
  const data = await fetchHeroAPI<{
    data?: {
      records?: Array<{
        data?: {
          relation?: {
            assist?: { target_hero_id?: unknown };
            strong?: { target_hero_id?: unknown };
            weak?: { target_hero_id?: unknown };
          };
        };
      }>;
    };
  }>("/hero-relation", name);

  const relation = data?.data?.records?.[0]?.data?.relation;
  if (!relation) return null;

  const heroes = await getAllHeroes();
  const heroMap = new Map(heroes.map((hero) => [hero.hero_id, hero]));

  const toHeroes = (rawIds: unknown) =>
    normalizeHeroIdList(rawIds)
      .map((id) => heroMap.get(id) ?? null)
      .filter((hero): hero is HeroListItem => !!hero);

  return {
    assist: toHeroes(relation.assist?.target_hero_id),
    strong: toHeroes(relation.strong?.target_hero_id),
    weak: toHeroes(relation.weak?.target_hero_id),
  };
}

function toTitleCase(input: string) {
  return input
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function normalizeHeroStats(raw: unknown): HeroDetailStat[] {
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  const candidates: Record<string, unknown>[] = [];

  const maybeData = (record.data as { records?: Array<{ data?: Record<string, unknown> }> } | undefined);
  const firstData = maybeData?.records?.[0]?.data;
  if (firstData && typeof firstData === "object") candidates.push(firstData);

  const firstHeroData = (firstData as { hero?: { data?: Record<string, unknown> } } | undefined)?.hero?.data;
  if (firstHeroData && typeof firstHeroData === "object") candidates.push(firstHeroData);

  candidates.push(record);

  for (const candidate of candidates) {
    const entries = Object.entries(candidate)
      .filter(([key]) => !["name", "head", "painting", "story", "hero", "hero_id", "heroid"].includes(key))
      .map(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          return { label: toTitleCase(key), value: String(value) };
        }
        if (Array.isArray(value)) {
          const list = value.filter((item) => typeof item === "string" || typeof item === "number");
          if (!list.length) return null;
          return { label: toTitleCase(key), value: list.map(String).join(", ") };
        }
        return null;
      })
      .filter((item): item is HeroDetailStat => !!item && item.value.trim().length > 0);

    if (entries.length >= 3) return entries;
  }

  return [];
}

export async function getHeroDetailStats(name: string): Promise<HeroDetailStat[]> {
  const data = await fetchHeroAPI<unknown>("/hero-detail-stats", name);
  if (!data) return [];
  return normalizeHeroStats(data);
}
