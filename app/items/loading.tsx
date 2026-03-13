export default function ItemsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 animate-pulse">
      <div className="mb-5 h-9 w-full rounded-xl border border-white/10 bg-[#111522]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 18 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-white/10 bg-[#111522] p-3">
            <div className="mb-2 aspect-square rounded-lg bg-white/10" />
            <div className="h-3 w-3/4 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
