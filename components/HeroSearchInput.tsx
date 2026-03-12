"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function HeroSearchInput({ initialValue = "" }: { initialValue?: string }) {
  const [q, setQ] = useState(initialValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/heroes?search=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari hero, misalnya: Layla, Fanny, Gusion..."
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push("/heroes");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      )}
    </form>
  );
}
