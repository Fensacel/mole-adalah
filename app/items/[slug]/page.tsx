import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemBySlug } from "@/lib/items";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ItemDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getItemBySlug(slug);

  if (!item) notFound();

  const [price = "-", category = "-", ...details] = item.stats;
  const passiveLines = details.filter((line) => line.toLowerCase().startsWith("pasif:"));
  const statLines = details.filter((line) => !line.toLowerCase().startsWith("pasif:"));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/items" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          Kembali ke daftar item
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#13151f] overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-white/5 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#0a0c14] border border-white/10 shrink-0">
            <Image src={item.image_url} alt={item.name} fill className="object-contain p-2" unoptimized sizes="96px" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-4xl font-black mb-1">{item.name}</h1>
            <p className="text-base text-gray-400">{category}</p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <h2 className="text-2xl font-bold mb-4">Karakteristik Item</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-2xl font-semibold text-gray-400 mb-2">Harga</p>
              <p className="text-4xl font-black text-blue-400">{price} gold</p>
            </div>

            <div>
              <p className="text-2xl font-semibold text-gray-400 mb-2">Stats</p>
              <ul className="space-y-1.5 text-2xl text-gray-200">
                {statLines.length > 0 ? (
                  statLines.map((line, index) => (
                    <li key={`${item.slug}-stat-${index}`} className="leading-relaxed">• {line}</li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-2xl font-semibold text-gray-400 mb-2">Pasif</p>
              <div className="space-y-2 text-xl text-gray-300 leading-relaxed">
                {passiveLines.length > 0 ? (
                  passiveLines.map((line, index) => (
                    <p key={`${item.slug}-passive-${index}`}>{line.replace(/^Pasif:\s*/i, "")}</p>
                  ))
                ) : (
                  <p>-</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
