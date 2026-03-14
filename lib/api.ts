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

export interface HeroAbility {
  section: string;
  name: string;
  image_url: string;
  tags: string[];
  description: string;
  properties: Record<string, unknown>;
}

export interface HeroAbilityData {
  slug: string;
  name: string;
  url: string;
  intro: string;
  infobox: Record<string, string>;
  abilities: HeroAbility[];
}

export interface MplIdTeam {
  team_name: string;
  team_logo: string;
  team_url: string;
}

export interface MplIdStanding {
  rank: number;
  team_name: string;
  team_logo: string;
  match_point: number;
  match_wl: string;
  net_game_win: number;
  game_wl: string;
}

export interface MplIdRosterMember {
  player_name: string;
  player_role: string;
  player_image: string;
}

export interface MplIdTeamDetail {
  team_name: string;
  team_logo: string;
  social_media: Record<string, string>;
  roster: MplIdRosterMember[];
}

export interface MplIdTeamStat {
  [key: string]: string | number | boolean | null;
}

export interface MplIdPlayerStat {
  [key: string]: string | number | boolean | null;
}

export interface MplIdTransfer {
  [key: string]: string | number | boolean | null;
}

export interface MplIdHeroStat {
  [key: string]: string | number | boolean | null;
}

export interface MplIdHeroPool {
  [key: string]: string | number | boolean | null;
}

export interface MplIdPlayerPool {
  [key: string]: string | number | boolean | null;
}

export interface MplIdEndpointHealth {
  endpoint: string;
  ok: boolean;
  status: number;
  count: number | null;
  message: string;
}

interface FetchApiOptions {
  cache?: RequestCache;
  revalidate?: number | false;
}

async function fetchAPI<T>(endpoint: string, options?: FetchApiOptions): Promise<T | null> {
  try {
    const init: RequestInit & { next?: { revalidate: number } } = {};

    if (options?.cache) {
      init.cache = options.cache;
    }

    if (typeof options?.revalidate === "number") {
      init.next = { revalidate: options.revalidate };
    } else if (options?.revalidate !== false) {
      init.next = { revalidate: 3600 };
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...init,
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

async function fetchHeroAPI<T>(baseEndpoint: string, name: string, options?: FetchApiOptions): Promise<T | null> {
  const variants = getHeroParamVariants(name);
  if (!variants.length) return null;

  for (const variant of variants) {
    const data = await fetchAPI<T>(`${baseEndpoint}/${encodeURIComponent(variant)}/`, options);
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

export async function getHeroDetail(name: string, options?: { noCache?: boolean }): Promise<HeroDetail | null> {
  const fetchOptions = options?.noCache
    ? ({ cache: "no-store", revalidate: false } as const)
    : undefined;

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
  }>("/hero-detail", name, fetchOptions);

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

function normalizeAbilityFileVariants(name: string): string[] {
  const raw = name.trim();
  if (!raw) return [];

  const decoded = decodeURIComponent(raw);
  const noSlash = decoded.replace(/[\\/]/g, "-").trim();
  const noColon = noSlash.replace(/:/g, "").trim();

  return [...new Set([raw, decoded, noSlash, noColon].filter((value) => value.length > 0))];
}

function normalizeAbilityEntry(raw: unknown): HeroAbility | null {
  if (!raw || typeof raw !== "object") return null;

  const entry = raw as Record<string, unknown>;
  const section = typeof entry.section === "string" ? entry.section.trim() : "";
  const name = typeof entry.name === "string" ? entry.name.trim() : "";
  const image_url = typeof entry.image_url === "string" ? entry.image_url.trim() : "";
  const tags = Array.isArray(entry.tags)
    ? entry.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];
  const description = typeof entry.description === "string" ? entry.description.trim() : "";
  const properties = entry.properties && typeof entry.properties === "object" ? (entry.properties as Record<string, unknown>) : {};

  if (!name) return null;

  return {
    section,
    name,
    image_url,
    tags,
    description,
    properties,
  };
}

export async function getHeroAbilities(name: string): Promise<HeroAbilityData | null> {
  const variants = normalizeAbilityFileVariants(name);
  if (!variants.length) return null;

  for (const variant of variants) {
    try {
      const mod = await import(`../app/heroes/[name]/hero_abilities/${variant}.json`);
      const payload = (mod.default ?? mod) as Record<string, unknown>;
      const abilitiesRaw = Array.isArray(payload.abilities) ? payload.abilities : [];

      const abilities = abilitiesRaw
        .map((entry) => normalizeAbilityEntry(entry))
        .filter((entry): entry is HeroAbility => !!entry);

      return {
        slug: typeof payload.slug === "string" ? payload.slug : variant,
        name: typeof payload.name === "string" ? payload.name : variant,
        url: typeof payload.url === "string" ? payload.url : "",
        intro: typeof payload.intro === "string" ? payload.intro : "",
        infobox: payload.infobox && typeof payload.infobox === "object" ? (payload.infobox as Record<string, string>) : {},
        abilities,
      };
    } catch {
      // Continue searching across filename variants.
    }
  }

  return null;
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

export async function getMplIdTeams(): Promise<MplIdTeam[]> {
  const data = await fetchAPI<MplIdTeam[]>("/mplid/teams/");
  if (!Array.isArray(data)) return [];

  return data
    .filter((team) => team && typeof team.team_name === "string")
    .map((team) => ({
      team_name: team.team_name,
      team_logo: typeof team.team_logo === "string" ? team.team_logo : "",
      team_url: typeof team.team_url === "string" ? team.team_url : "",
    }));
}

export function extractMplTeamId(teamUrl: string): string | null {
  if (!teamUrl || typeof teamUrl !== "string") return null;
  const normalized = teamUrl.trim().replace(/\/+$/, "");
  if (!normalized) return null;
  const last = normalized.split("/").filter(Boolean).pop() ?? "";
  return last.length > 0 ? last.toLowerCase() : null;
}

export async function getMplIdStandings(): Promise<MplIdStanding[]> {
  const data = await fetchAPI<Array<Record<string, unknown>>>("/mplid/standings/");
  if (!Array.isArray(data)) return [];

  return data
    .map((row) => ({
      rank: typeof row.rank === "number" ? row.rank : Number(row.rank ?? 0),
      team_name: typeof row.team_name === "string" ? row.team_name : "Unknown",
      team_logo: typeof row.team_logo === "string" ? row.team_logo : "",
      match_point: typeof row.match_point === "number" ? row.match_point : Number(row.match_point ?? 0),
      match_wl: typeof row.match_wl === "string" ? row.match_wl : "0-0",
      net_game_win: typeof row.net_game_win === "number" ? row.net_game_win : Number(row.net_game_win ?? 0),
      game_wl: typeof row.game_wl === "string" ? row.game_wl : "0-0",
    }))
    .filter((row) => Number.isFinite(row.rank) && row.team_name.length > 0)
    .sort((a, b) => a.rank - b.rank);
}

export async function getMplIdTeamDetail(teamId: string): Promise<MplIdTeamDetail | null> {
  const normalized = teamId.trim().toLowerCase();
  if (!normalized) return null;

  const data = await fetchAPI<Record<string, unknown>>(`/mplid/teams/${encodeURIComponent(normalized)}/`);
  if (!data || typeof data !== "object") return null;

  const rosterRaw = Array.isArray(data.roster) ? data.roster : [];
  const roster = rosterRaw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        player_name: typeof row.player_name === "string" ? row.player_name : "Unknown",
        player_role: typeof row.player_role === "string" ? row.player_role : "Unknown",
        player_image: typeof row.player_image === "string" ? row.player_image : "",
      };
    })
    .filter((entry): entry is MplIdRosterMember => !!entry);

  const socialRaw = data.social_media && typeof data.social_media === "object"
    ? (data.social_media as Record<string, unknown>)
    : {};
  const social_media = Object.fromEntries(
    Object.entries(socialRaw)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, value as string]),
  );

  return {
    team_name: typeof data.team_name === "string" ? data.team_name : normalized.toUpperCase(),
    team_logo: typeof data.team_logo === "string" ? data.team_logo : "",
    social_media,
    roster,
  };
}

export async function getMplIdTeamStats(teamId?: string): Promise<MplIdTeamStat[]> {
  const endpoint = teamId?.trim()
    ? `/mplid/team-stats/?team=${encodeURIComponent(teamId.trim().toLowerCase())}`
    : "/mplid/team-stats/";

  const data = await fetchAPI<Array<Record<string, unknown>>>(endpoint, { revalidate: 600 });
  if (!Array.isArray(data)) return [];

  return data.map((row) => {
    const normalized: MplIdTeamStat = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
        normalized[key] = value;
      }
    }
    return normalized;
  });
}

export async function getMplIdPlayerStats(teamId?: string): Promise<MplIdPlayerStat[]> {
  const endpoint = teamId?.trim()
    ? `/mplid/player-stats/?team=${encodeURIComponent(teamId.trim().toLowerCase())}`
    : "/mplid/player-stats/";

  const data = await fetchAPI<Array<Record<string, unknown>>>(endpoint, { revalidate: 600 });
  if (!Array.isArray(data)) return [];

  return data.map((row) => {
    return normalizeMplScalarRow(row);
  });
}

function normalizeMplScalarRow(row: Record<string, unknown>) {
  const normalized: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      normalized[key] = value;
    }
  }
  return normalized;
}

export async function getMplIdTransfers(): Promise<MplIdTransfer[]> {
  const data = await fetchAPI<Array<Record<string, unknown>>>("/mplid/transfers/", { revalidate: 600 });
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeMplScalarRow(row));
}

export async function getMplIdHeroStats(): Promise<MplIdHeroStat[]> {
  const data = await fetchAPI<Array<Record<string, unknown>>>("/mplid/hero-stats/", { revalidate: 600 });
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeMplScalarRow(row));
}

export async function getMplIdHeroPools(): Promise<MplIdHeroPool[]> {
  const data = await fetchAPI<Array<Record<string, unknown>>>("/mplid/hero-pools/", { revalidate: 600 });
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeMplScalarRow(row));
}

export async function getMplIdPlayerPools(): Promise<MplIdPlayerPool[]> {
  const data = await fetchAPI<Array<Record<string, unknown>>>("/mplid/player-pools/", { revalidate: 600 });
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeMplScalarRow(row));
}

export async function getMplIdEndpointHealth(endpoint: string): Promise<MplIdEndpointHealth> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        endpoint,
        ok: false,
        status: res.status,
        count: null,
        message: `Upstream responded ${res.status}`,
      };
    }

    const payload = await res.json();
    const count = Array.isArray(payload) ? payload.length : null;

    return {
      endpoint,
      ok: true,
      status: res.status,
      count,
      message: Array.isArray(payload)
        ? `Loaded ${count} row${count === 1 ? "" : "s"}`
        : "Loaded object payload",
    };
  } catch {
    return {
      endpoint,
      ok: false,
      status: 0,
      count: null,
      message: "Network error while reaching upstream",
    };
  }
}
