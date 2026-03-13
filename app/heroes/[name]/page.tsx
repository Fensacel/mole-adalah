import { notFound } from "next/navigation";
import Image from "next/image";

export const runtime = 'edge';
import Link from "next/link";
import {
  getHeroDetail,
  getHeroRate,
  getHeroCounter,
  getHeroCompatibility,
  getHeroSkillCombo,
  getHeroRelation,
} from "@/lib/api";
import StatCard from "@/components/StatCard";
import HeroRelationTable from "@/components/HeroRelationTable";
import { ArrowLeft, ChevronRight, Shield, Swords, Target, Zap } from "lucide-react";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params;
  const heroName = decodeURIComponent(name);
  return {
    title: `${heroName} — Draft Whisperer`,
    description: `Stats, counters, and synergies for ${heroName} in Mobile Legends.`,
  };
}

export default async function HeroDetailPage({ params }: Props) {
  const { name } = await params;
  const heroName = decodeURIComponent(name);

  const [detail, rate, counter, compatibility, skillCombos, relation] = await Promise.all([
    getHeroDetail(heroName),
    getHeroRate(heroName),
    getHeroCounter(heroName),
    getHeroCompatibility(heroName),
    getHeroSkillCombo(heroName),
    getHeroRelation(heroName),
  ]);

  if (!detail) notFound();

  const winRate = counter?.main_hero_win_rate ?? rate?.win_rate ?? 0;
  const banRate = counter?.main_hero_ban_rate ?? rate?.ban_rate ?? 0;
  const useRate = counter?.main_hero_appearance_rate ?? rate?.app_rate ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <Link
        href="/heroes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-blue-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Hero List
      </Link>

      <section className="relative mb-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-[#070b14]">
        {detail.painting && (
          <div className="absolute inset-0">
            <Image src={detail.painting} alt="" fill className="object-cover object-top opacity-35" unoptimized sizes="100vw" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050811] via-[#050811]/85 to-[#050811]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.35),transparent_55%)]" />

        <div className="relative z-10 flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-blue-400/30 bg-[#0b1224] shadow-[0_0_30px_rgba(59,130,246,0.28)] sm:h-32 sm:w-32">
              <Image src={detail.head} alt={detail.name} fill className="object-cover" unoptimized sizes="128px" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[11px] uppercase tracking-[0.25em] text-blue-200/80">MLBB Hero Spotlight</p>
              <h1 className="truncate text-3xl font-black text-white sm:text-5xl">{detail.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.role.map((role) => (
                  <span key={role} className="rounded-full border border-blue-300/30 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
                    {role}
                  </span>
                ))}
                {detail.lane.map((lane) => (
                  <span key={lane} className="rounded-full border border-cyan-300/25 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                    {lane}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {detail.specialty.length > 0 && (
            <div className="max-w-lg rounded-2xl border border-white/10 bg-[#0a1224]/80 p-4 backdrop-blur">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-blue-200/70">Specialty</p>
              <p className="text-sm text-gray-200">{detail.specialty.join(", ")}</p>
            </div>
          )}
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Win Rate"
          value={winRate > 0 ? `${(winRate * 100).toFixed(1)}%` : "—"}
          color="green"
          description={winRate >= 0.54 ? "Above average" : winRate <= 0.46 ? "Below average" : "Average"}
        />
        <StatCard
          label="Ban Rate"
          value={banRate > 0 ? `${(banRate * 100).toFixed(1)}%` : "—"}
          color="purple"
          description={banRate > 0.2 ? "Frequently banned" : "Rarely banned"}
        />
        <StatCard
          label="Use Rate"
          value={useRate > 0 ? `${(useRate * 100).toFixed(1)}%` : "—"}
          color="blue"
          description={useRate > 0.05 ? "Frequently played" : "Rarely played"}
        />
      </div>

      {detail.story && (
        <section className="mb-8 rounded-2xl border border-blue-500/20 bg-[#0b1221] p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-blue-100">Lore</h2>
          <p className="text-sm leading-relaxed text-gray-300">{detail.story}</p>
        </section>
      )}

      {skillCombos.length > 0 && (
        <section className="mb-8 rounded-2xl border border-blue-500/20 bg-[#0b1221] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-blue-200">
            <Zap className="h-5 w-5" />
            <h2 className="text-lg font-bold">Hero Skill Combo</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {skillCombos.map((combo, idx) => (
              <article key={`${combo.title}-${idx}`} className="rounded-xl border border-white/10 bg-[#060b17] p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200/70">{combo.title}</p>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {combo.skills.map((skill, index) => (
                    <div key={`${skill.skill_id}-${index}`} className="flex items-center gap-2">
                      <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-blue-300/30 bg-[#13213f]">
                        <Image src={skill.skill_icon} alt={`Skill ${skill.skill_id}`} fill className="object-cover" unoptimized sizes="36px" />
                      </div>
                      {index < combo.skills.length - 1 && <ChevronRight className="h-4 w-4 text-blue-300/70" />}
                    </div>
                  ))}
                </div>
                {combo.description && <p className="text-sm text-gray-300">{combo.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {relation && (relation.assist.length > 0 || relation.strong.length > 0 || relation.weak.length > 0) && (
        <section className="mb-8 rounded-2xl border border-blue-500/20 bg-[#0b1221] p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-blue-100">Hero Relation</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: "assist", label: "Assist", heroes: relation.assist, tone: "border-cyan-400/30 bg-cyan-500/10" },
              { key: "strong", label: "Strong VS", heroes: relation.strong, tone: "border-green-400/30 bg-green-500/10" },
              { key: "weak", label: "Weak VS", heroes: relation.weak, tone: "border-red-400/30 bg-red-500/10" },
            ].map((group) => (
              <div key={group.key} className={`rounded-xl border p-3 ${group.tone}`}>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-100/90">{group.label}</p>
                <div className="space-y-2">
                  {group.heroes.map((hero) => (
                    <Link
                      key={hero.hero_id}
                      href={`/heroes/${encodeURIComponent(hero.name)}`}
                      className="flex items-center gap-2 rounded-lg bg-black/20 p-2 transition-colors hover:bg-black/35"
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-md border border-white/10">
                        <Image src={hero.head} alt={hero.name} fill className="object-cover" unoptimized sizes="32px" />
                      </div>
                      <p className="truncate text-sm text-gray-100">{hero.name}</p>
                    </Link>
                  ))}
                  {group.heroes.length === 0 && <p className="text-xs text-gray-300/70">No data.</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {counter && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Swords className="h-5 w-5" />
              <h2 className="text-lg font-bold">Counter Hero</h2>
            </div>
            <HeroRelationTable
              title="Heroes favored against this hero"
              subtitle="Heroes with higher win rates when facing this hero"
              heroes={counter.counters}
              type="counter"
              mainWinRate={winRate}
            />
            {counter.worst_matchups.length > 0 && (
              <HeroRelationTable
                title="Heroes weak against this hero"
                subtitle="Heroes that tend to lose when facing this hero"
                heroes={counter.worst_matchups}
                type="counter"
                mainWinRate={winRate}
              />
            )}
          </div>
        )}

        {compatibility && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <Shield className="h-5 w-5" />
              <h2 className="text-lg font-bold">Synergy Hero</h2>
            </div>
            <HeroRelationTable
              title="Heroes that pair well with this hero"
              subtitle="Heroes that increase win rate when played together"
              heroes={compatibility.best_synergies}
              type="synergy"
              mainWinRate={winRate}
            />
            {compatibility.worst_synergies.length > 0 && (
              <HeroRelationTable
                title="Heroes with poor synergy"
                subtitle="Heroes that lower win rate when played together"
                heroes={compatibility.worst_synergies}
                type="counter"
                mainWinRate={winRate}
              />
            )}
          </div>
        )}
      </div>

      {!counter && !compatibility && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
          <Target className="mx-auto mb-3 h-8 w-8 text-yellow-400" />
          <p className="mb-1 font-bold text-yellow-300">Stats data unavailable</p>
          <p className="text-sm text-gray-400">The API did not return counter/compatibility data for this hero.</p>
        </div>
      )}
    </div>
  );
}
