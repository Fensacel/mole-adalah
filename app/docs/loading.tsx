export default function DocsLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-10 sm:py-12">
      <div className="h-44 rounded-3xl border border-white/10 bg-[#10192d]" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-44 rounded-2xl border border-white/10 bg-[#10192d]" />
        ))}
      </div>
    </div>
  );
}