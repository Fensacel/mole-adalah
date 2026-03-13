export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] px-4 py-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-4 h-2 w-40 rounded-full bg-blue-500/40" />
        <div className="mb-8 h-6 w-72 rounded bg-white/10" />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 rounded-2xl border border-white/10 bg-[#111522]" />
          <div className="h-28 rounded-2xl border border-white/10 bg-[#111522]" />
          <div className="h-28 rounded-2xl border border-white/10 bg-[#111522]" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 16 }).map((_, index) => (
            <div key={index} className="aspect-square rounded-xl border border-white/10 bg-[#111522]" />
          ))}
        </div>
      </div>
    </div>
  );
}
