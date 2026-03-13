export default function HeroDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 animate-pulse">
      <div className="mb-6 h-5 w-40 rounded bg-white/10" />

      <section className="relative mb-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-[#070b14] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="h-24 w-24 shrink-0 rounded-2xl border-2 border-blue-400/30 bg-white/10 sm:h-32 sm:w-32" />
            <div className="min-w-0 flex-1">
              <div className="mb-2 h-3 w-28 rounded bg-blue-400/30" />
              <div className="mb-3 h-9 w-48 rounded bg-white/10 sm:h-11 sm:w-64" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-20 rounded-full bg-blue-500/20" />
                <div className="h-6 w-20 rounded-full bg-blue-500/20" />
                <div className="h-6 w-20 rounded-full bg-cyan-500/15" />
              </div>
            </div>
          </div>

          <div className="h-20 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1224]/80" />
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-2xl border border-white/10 bg-[#0b1221]" />
        <div className="h-28 rounded-2xl border border-white/10 bg-[#0b1221]" />
        <div className="h-28 rounded-2xl border border-white/10 bg-[#0b1221]" />
      </div>

      <section className="mb-8 rounded-2xl border border-blue-500/20 bg-[#0b1221] p-5 sm:p-6">
        <div className="mb-3 h-6 w-32 rounded bg-white/10" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-11/12 rounded bg-white/10" />
          <div className="h-4 w-10/12 rounded bg-white/10" />
        </div>
      </section>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-blue-500/20 bg-[#0b1221] p-5 sm:p-6">
          <div className="mb-4 h-6 w-40 rounded bg-white/10" />
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-[#060b17]" />
            <div className="h-16 rounded-xl bg-[#060b17]" />
            <div className="h-16 rounded-xl bg-[#060b17]" />
          </div>
        </section>

        <section className="rounded-2xl border border-blue-500/20 bg-[#0b1221] p-5 sm:p-6">
          <div className="mb-4 h-6 w-40 rounded bg-white/10" />
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-[#060b17]" />
            <div className="h-16 rounded-xl bg-[#060b17]" />
            <div className="h-16 rounded-xl bg-[#060b17]" />
          </div>
        </section>
      </div>
    </div>
  );
}
