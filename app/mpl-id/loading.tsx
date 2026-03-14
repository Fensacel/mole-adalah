export default function MplIdLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:py-12">
      <div className="h-52 rounded-3xl border border-white/10 bg-[#10192d]" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-44 rounded-2xl border border-white/10 bg-[#10192d]" />
        ))}
      </div>
      <div className="mt-7 h-52 rounded-2xl border border-white/10 bg-[#10192d]" />
    </div>
  );
}
