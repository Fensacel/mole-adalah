export default function DraftSimulatorLoading() {
  return (
    <div className="mx-auto max-w-[1400px] px-2 py-3 md:px-4 md:py-4 animate-pulse">
      <div className="mb-3 h-28 rounded-lg border border-white/10 bg-[#111522] md:mb-4" />
      <div className="mb-3 flex gap-2 overflow-x-auto md:mb-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-7 w-20 rounded-md bg-white/10" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9">
        {Array.from({ length: 36 }).map((_, index) => (
          <div key={index} className="aspect-square rounded-xl border border-white/10 bg-[#111522]" />
        ))}
      </div>
    </div>
  );
}
