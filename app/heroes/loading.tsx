export default function HeroesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 animate-pulse">
      <div className="mb-5 h-9 w-full rounded-xl border border-white/10 bg-[#111522]" />
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-7 w-20 rounded-full bg-white/10" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: 24 }).map((_, index) => (
          <div key={index} className="aspect-square rounded-xl border border-white/10 bg-[#111522]" />
        ))}
      </div>
    </div>
  );
}
