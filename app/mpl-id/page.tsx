import type { Metadata } from "next";
import Link from "next/link";
import {
  extractMplTeamId,
  getMplIdStandings,
  getMplIdTeams,
} from "@/lib/api";

export const metadata: Metadata = {
  title: "MPL ID - Draft Whisperer",
  description: "MPL Indonesia dashboard for standings, match data, and draft trends.",
};

const sections = [
  {
    title: "Standings",
    description: "Klasemen tim, match point, game differential, dan performa mingguan.",
    status: "Live",
    href: "/mpl-id",
  },
  {
    title: "Player Pools",
    description: "Distribusi hero yang paling sering dipakai oleh para pemain.",
    status: "Live",
    href: "/mpl-id/player-pools",
  },
];

export default async function MplIdPage() {
  const teams = await getMplIdTeams();
  const standings = await getMplIdStandings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[#111322] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(239,68,68,0.16),transparent_40%)]" />

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Esports Data Hub</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">MPL Indonesia</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Halaman ini jadi pusat data MPL ID untuk melihat standings, daftar tim, dan detail roster.
            Data akan terus diperbarui mengikuti perkembangan musim.
          </p>
        </div>
      </section>

      <section className="mt-7 rounded-2xl border border-white/10 bg-[#0f1529] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">MPL ID Standings</h2>
            <p className="mt-1 text-sm text-gray-300">Klasemen tim terbaru dari data MPL ID.</p>
          </div>
        </div>

        {standings.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#13203a] text-left text-blue-100">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Match Point</th>
                  <th className="px-3 py-2">Match W-L</th>
                  <th className="px-3 py-2">Net Game Win</th>
                  <th className="px-3 py-2">Game W-L</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={`${row.rank}-${row.team_name}`} className="border-t border-white/10 text-gray-200">
                    <td className="px-3 py-2 font-semibold text-amber-200">#{row.rank}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 overflow-hidden rounded border border-white/10 bg-[#10192d]">
                          {row.team_logo ? (
                            <img
                              src={row.team_logo}
                              alt={row.team_name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                        </div>
                        <span>{row.team_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.match_point}</td>
                    <td className="px-3 py-2">{row.match_wl}</td>
                    <td className="px-3 py-2">{row.net_game_win}</td>
                    <td className="px-3 py-2">{row.game_wl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Standings belum tersedia.
          </div>
        )}
      </section>

      <section className="mt-7 rounded-2xl border border-white/10 bg-[#0f1529] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">MPL ID Teams</h2>
            <p className="mt-1 text-sm text-gray-300">Daftar tim MPL Indonesia.</p>
          </div>
        </div>

        {teams.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => {
              const teamId = extractMplTeamId(team.team_url) ?? "unknown";

              return (
                <article key={team.team_name} className="rounded-xl border border-white/10 bg-[#0b1020] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-[#10192d]">
                    {teamId !== "unknown" ? (
                      <img
                        src={`/api/mplid/teams/${teamId}/logo`}
                        alt={team.team_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500">N/A</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-white">{team.team_name}</h3>
                    <p className="text-xs text-gray-400">MPL Indonesia Team</p>
                  </div>
                </div>
                {team.team_url ? (
                  <Link
                    href={`/mpl-id/teams/${teamId}`}
                    className="inline-flex rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                  >
                    View Team Detail
                  </Link>
                ) : (
                  <span className="inline-flex rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-400">
                    Team URL unavailable
                  </span>
                )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Data team belum tersedia saat ini. Coba refresh lagi beberapa saat.
          </div>
        )}
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="rounded-2xl border border-white/10 bg-[#0f1529] p-5">
            <div className="mb-3 inline-flex rounded-full border border-blue-400/30 bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold text-blue-100">
              {section.status}
            </div>
            <h2 className="text-lg font-bold text-white">{section.title}</h2>
            <p className="mt-2 text-sm text-gray-300">{section.description}</p>
            <Link
              href={section.href}
              className="mt-3 inline-flex rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              Open
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
