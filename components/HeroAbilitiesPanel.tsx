"use client";

import { useMemo, useState } from "react";
import type { HeroAbilityData } from "@/lib/api";

interface HeroAbilitiesPanelProps {
  abilityData: HeroAbilityData;
}

function toCellMap(value: unknown): Record<string, string> {
  if (typeof value === "string" || typeof value === "number") {
    return { "1": String(value) };
  }

  if (Array.isArray(value)) {
    const cells = value
      .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
      .map(String);

    return Object.fromEntries(cells.map((cell, idx) => [String(idx + 1), cell]));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => typeof item === "string" || typeof item === "number")
      .map(([key, item]) => [String(key), String(item)] as const);

    return Object.fromEntries(entries);
  }

  return {};
}

function sortLevelKeys(keys: string[]) {
  return [...keys].sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);
    const aIsNum = Number.isFinite(aNum);
    const bIsNum = Number.isFinite(bNum);

    if (aIsNum && bIsNum) return aNum - bNum;
    if (aIsNum) return -1;
    if (bIsNum) return 1;

    return a.localeCompare(b);
  });
}

export default function HeroAbilitiesPanel({ abilityData }: HeroAbilitiesPanelProps) {
  const abilities = abilityData.abilities;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = abilities[selectedIndex] ?? abilities[0];
  const selectedPropertyTable = useMemo(() => {
    const rows = Object.entries(selected?.properties ?? {})
      .filter(([label]) => label.trim().length > 0)
      .map(([label, rawValue]) => ({
        label,
        cells: toCellMap(rawValue),
      }))
      .filter((row) => Object.keys(row.cells).length > 0);

    const levelKeySet = new Set<string>();
    rows.forEach((row) => Object.keys(row.cells).forEach((level) => levelKeySet.add(level)));

    const levelKeys = sortLevelKeys(Array.from(levelKeySet));

    return {
      rows,
      levelKeys,
    };
  }, [selected]);

  if (!selected || abilities.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0b1221]">
      <div className="border-b border-white/10 bg-gradient-to-r from-[#111b34] to-[#0a1224] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-bold text-blue-100">Hero Abilities</h2>
        {abilityData.intro && <p className="mt-1 text-sm text-gray-300">{abilityData.intro}</p>}
      </div>

      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-center gap-3">
            {abilities.map((ability, idx) => {
              const active = idx === selectedIndex;

              return (
                <button
                  key={`${ability.section}-${ability.name}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 transition-all ${
                    active
                      ? "border-yellow-200 shadow-[0_0_24px_rgba(250,204,21,0.38)]"
                      : "border-blue-300/30 opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`Show detail ${ability.name}`}
                >
                  {ability.image_url ? (
                    <img
                      src={ability.image_url}
                      alt={ability.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        const img = event.currentTarget;
                        img.style.display = "none";
                        const fallback = img.nextElementSibling as HTMLDivElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#17284d] text-[10px] font-bold text-blue-100">N/A</div>
                  )}
                  <div
                    className="hidden h-full w-full items-center justify-center bg-[#17284d] text-[10px] font-bold text-blue-100"
                    aria-hidden="true"
                  >
                    N/A
                  </div>
                  <div className={`absolute inset-0 ${active ? "bg-yellow-300/10" : "bg-black/20 group-hover:bg-black/10"}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 pt-3 sm:px-6 sm:pb-6">
        <div className="rounded-xl border border-white/10 bg-[#060b17] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200/75">{selected.section || "Ability"}</p>
            {selected.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-100"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3 className="mt-2 text-xl font-bold text-white">{selected.name}</h3>

          {selected.description && <p className="mt-3 text-sm leading-relaxed text-gray-300">{selected.description}</p>}

          {selectedPropertyTable.rows.length > 0 && selectedPropertyTable.levelKeys.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="mb-2 text-sm font-bold text-blue-100">Level scaling</p>
              <table className="min-w-full border border-[#5070a0]/60 text-sm text-gray-100">
                <thead>
                  <tr className="bg-[#c9ab5f] text-[#0d1c3f]">
                    <th className="border border-[#5070a0]/60 px-3 py-1.5 text-left font-bold">Properties</th>
                    {selectedPropertyTable.levelKeys.map((levelKey) => (
                      <th key={levelKey} className="border border-[#5070a0]/60 px-3 py-1.5 text-center font-bold">
                        {levelKey}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedPropertyTable.rows.map((row) => (
                    <tr key={row.label} className="bg-[#0f2e63]/35">
                      <td className="border border-[#5070a0]/60 px-3 py-1.5 font-semibold text-gray-100">{row.label}</td>
                      {selectedPropertyTable.levelKeys.map((levelKey) => (
                        <td key={`${row.label}-${levelKey}`} className="border border-[#5070a0]/60 px-3 py-1.5 text-center text-gray-100/95">
                          {row.cells[levelKey] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}