import Link from "next/link";
import type { MplIdEndpointHealth } from "@/lib/api";

interface MplDataTableSectionProps {
  title: string;
  description: string;
  data: Array<Record<string, string | number | boolean | null>>;
  health: MplIdEndpointHealth;
  backHref?: string;
  backLabel?: string;
}

function formatCellValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isImageUrl(value: string, column: string) {
  const lower = value.toLowerCase();
  return column.includes("logo") || column.includes("image") || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(lower);
}

function formatColumnName(column: string) {
  return column
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderCell(column: string, value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-500">-</span>;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return <span className={value === 0 ? "text-gray-400" : "text-gray-100"}>{value}</span>;
  }

  if (typeof value === "string" && isUrl(value)) {
    if (isImageUrl(value, column.toLowerCase())) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 overflow-hidden rounded border border-white/10 bg-[#0a1323]">
            <img
              src={value}
              alt={column}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      );
    }

    return <span title={value}>{value.length > 42 ? `${value.slice(0, 42)}...` : value}</span>;
  }

  const text = formatCellValue(value);
  if (text.length > 64) {
    return <span title={text}>{text.slice(0, 64)}...</span>;
  }

  return text;
}

export default function MplDataTableSection({
  title,
  description,
  data,
  health,
  backHref = "/mpl-id",
  backLabel = "Back to MPL ID",
}: MplDataTableSectionProps) {
  const columns = Array.from(new Set(data.flatMap((row) => Object.keys(row))));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
      <section className="rounded-3xl border border-cyan-500/25 bg-[#101a2d] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">MPL ID</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">{description}</p>
      </section>

      <section className="mt-7 rounded-2xl border border-white/10 bg-[#0f1529] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Tabel Data</h2>
          <Link
            href={backHref}
            className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
          >
            {backLabel}
          </Link>
        </div>

        {data.length > 0 && columns.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#13203a] text-left text-blue-100">
                  {columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-3 py-2">{formatColumnName(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-t border-white/10 text-gray-200">
                    {columns.map((column) => (
                      <td key={`${idx}-${column}`} className="whitespace-nowrap px-3 py-2">{renderCell(column, row[column])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Belum ada data yang bisa ditampilkan saat ini.
          </div>
        )}
      </section>
    </div>
  );
}
