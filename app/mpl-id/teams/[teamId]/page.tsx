import type { Metadata } from "next";
import Link from "next/link";
import { getMplIdTeamDetail } from "@/lib/api";
import { ArrowLeft, Facebook, Instagram, Youtube } from "lucide-react";

interface Props {
  params: Promise<{ teamId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: `MPL ID Team ${teamId.toUpperCase()} - Draft Whisperer`,
    description: "Team detail MPL Indonesia.",
  };
}

export default async function MplIdTeamDetailPage({ params }: Props) {
  const { teamId } = await params;
  const detail = await getMplIdTeamDetail(teamId);

  if (!detail) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
          Team detail tidak ditemukan untuk id: {teamId}
        </div>
      </div>
    );
  }

  const socialEntries = Object.entries(detail.social_media);
  const socialLinks = {
    facebook: detail.social_media.facebook,
    instagram: detail.social_media.instagram,
    youtube: detail.social_media.youtube,
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b17] px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_24%,rgba(190,24,93,0.18),transparent_32%),radial-gradient(circle_at_86%_12%,rgba(59,130,246,0.14),transparent_36%),radial-gradient(circle_at_80%_72%,rgba(190,24,93,0.12),transparent_34%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/mpl-id"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to MPL ID
          </Link>

          <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/15 bg-[#10192d] shadow-sm">
            {detail.team_logo ? (
              <img
                src={detail.team_logo}
                alt={detail.team_name}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#0c1224]/90 p-5 shadow-[0_15px_50px_rgba(10,14,30,0.5)] sm:p-8">
          <div className="mb-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200/80">{detail.team_name}</p>
          </div>

          {socialEntries.length > 0 && (
            <div className="mb-6 flex justify-center gap-3">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300/30 bg-blue-500/10 text-blue-100 transition-colors hover:bg-blue-500/30"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300/30 bg-blue-500/10 text-blue-100 transition-colors hover:bg-blue-500/30"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300/30 bg-blue-500/10 text-blue-100 transition-colors hover:bg-blue-500/30"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          <h2 className="mb-6 text-center text-3xl font-black uppercase tracking-[0.04em] text-white sm:text-4xl">
            Roster Season 17
          </h2>

          {detail.roster.length > 0 ? (
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
              {detail.roster.map((member) => (
                <article key={`${member.player_name}-${member.player_role}`} className="group text-center">
                  <div className="relative mx-auto mb-4 w-full max-w-[280px] overflow-visible">
                    <div className="mx-auto h-[250px] w-[92%] rounded-sm bg-gradient-to-b from-[#2a2030] to-[#1f1b2f] shadow-[0_10px_24px_rgba(10,14,30,0.5)] transition-transform duration-300 group-hover:-translate-y-1" />
                    <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
                      <div className="h-[280px] w-full max-w-[260px] overflow-hidden">
                        {member.player_image ? (
                          <img
                            src={member.player_image}
                            alt={member.player_name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                            Player Image
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute -bottom-4 left-1/2 z-20 w-[85%] -translate-x-1/2 rounded-xl border-2 border-[#ee4056]/65 bg-[#f8fafc] px-3 py-2 shadow-[4px_6px_0_rgba(117,17,37,0.9)]">
                      <p className="truncate text-base font-black uppercase tracking-wide text-[#2f3442]">{member.player_name}</p>
                    </div>
                  </div>

                  <p className="text-[30px] font-semibold uppercase tracking-wide text-blue-100 sm:text-[32px]" style={{ fontFamily: "Bebas Neue, Oswald, sans-serif" }}>
                    {member.player_role}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-yellow-400/35 bg-yellow-100/70 p-4 text-sm text-yellow-900">
              Roster belum tersedia untuk tim ini.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
