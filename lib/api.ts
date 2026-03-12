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
  const data = await fetchAPI<{
    data: {
      records: Array<{
        data: {
          win_rate: Array<{ win_rate: number; ban_rate: number; app_rate: number; date: string }>;
        };
      }>;
    };
  }>(`/hero-rate/${encodeURIComponent(name)}/`);
  if (!data || !data.data.records.length) return null;
  const latest = data.data.records[0].data.win_rate;
  if (!latest || !latest.length) return null;
  // Find the most recent valid entry
  const sorted = [...latest].sort((a, b) => b.date.localeCompare(a.date));
  const valid = sorted.find((r) => r.win_rate > 0);
  return valid || sorted[0];
}

export async function getHeroCounter(name: string): Promise<HeroCounterData | null> {
  const data = await fetchAPI<{
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
  }>(`/hero-counter/${encodeURIComponent(name)}/`);

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
  const data = await fetchAPI<{
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
  }>(`/hero-compatibility/${encodeURIComponent(name)}/`);

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
  const data = await fetchAPI<{
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
  }>(`/hero-detail/${encodeURIComponent(name)}/`);

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
