"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Swords, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/heroes?search=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0d0f17]/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            MLBB<span className="text-orange-400">Analytics</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 text-sm text-gray-400">
          <Link href="/" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors">
            Home
          </Link>
          <Link href="/heroes" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors">
            Hero
          </Link>
          <Link href="/items" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors">
            Item
          </Link>
          <Link href="/rankings" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors">
            Rankings
          </Link>
          <Link href="/draft" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors">
            Draft
          </Link>
        </nav>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari hero..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-colors"
          />
        </form>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden px-4 pb-4 flex flex-col gap-1 text-sm text-gray-400 border-t border-white/5">
          <Link href="/" className="px-3 py-2 rounded-md hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/heroes" className="px-3 py-2 rounded-md hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>Hero</Link>
          <Link href="/items" className="px-3 py-2 rounded-md hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>Item</Link>
          <Link href="/rankings" className="px-3 py-2 rounded-md hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>Rankings</Link>
          <Link href="/draft" className="px-3 py-2 rounded-md hover:text-white hover:bg-white/5" onClick={() => setMenuOpen(false)}>Draft</Link>
        </nav>
      )}
    </header>
  );
}
