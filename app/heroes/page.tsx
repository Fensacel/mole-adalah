import { getAllHeroes } from "@/lib/api";
import HeroSearchInput from "@/components/HeroSearchInput";
import Image from "next/image";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function HeroesPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.search?.toLowerCase() ?? "";

  const heroes = await getAllHeroes();

  const filtered = query
    ? heroes.filter((h) => h.name.toLowerCase().includes(query))
    : heroes;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-1">Hero Mobile Legends</h1>
        <p className="text-gray-400 text-sm">
          {filtered.length} hero{query ? ` untuk "${params.search}"` : " tersedia"}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <HeroSearchInput initialValue={params.search ?? ""} />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 xl:grid-cols-13 gap-1.5">
          {filtered.map((hero) => (
            <Link
              key={hero.hero_id}
              href={`/heroes/${encodeURIComponent(hero.name)}`}
              className="group rounded-lg overflow-hidden border border-white/5 hover:border-orange-500/60 transition-all bg-[#13151f]"
            >
              <div className="relative aspect-square bg-[#0a0c14]">
                <Image
                  src={hero.head}
                  alt={hero.name}
                  fill
                  className="object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-300"
                  unoptimized
                  sizes="(max-width: 640px) 20vw, (max-width: 1024px) 11vw, 100px"
                />
              </div>
              <p className="text-[10px] sm:text-xs text-center py-1 px-0.5 truncate text-gray-400 group-hover:text-white transition-colors">
                {hero.name}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-xl font-bold mb-2">Hero tidak ditemukan</p>
          <p className="text-gray-500 text-sm">
            Tidak ada hero dengan nama &ldquo;{params.search}&rdquo;. Coba nama lain.
          </p>
        </div>
      )}
    </div>
  );
}
