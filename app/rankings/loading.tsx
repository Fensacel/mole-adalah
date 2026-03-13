export default function RankingsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 animate-pulse">
      <div className="mb-4 h-7 w-48 rounded bg-white/10" />
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111522]">
        <div className="grid grid-cols-4 border-b border-white/10 px-4 py-3 text-xs">
          <div className="h-3 w-10 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-3 w-12 rounded bg-white/10" />
          <div className="h-3 w-12 rounded bg-white/10" />
        </div>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 items-center border-b border-white/5 px-4 py-3">
            <div className="h-3 w-6 rounded bg-white/10" />
            <div className="h-3 w-28 rounded bg-white/10" />
            <div className="h-3 w-10 rounded bg-white/10" />
            <div className="h-3 w-10 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
