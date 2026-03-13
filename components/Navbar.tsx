"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0d0f17]/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-4 shrink-0">
          <Image
            src="/logo.webp"
            alt="Draft Whisperer"
            width={72}
            height={72}
            className="h-14 w-14 md:h-16 md:w-16 object-contain shrink-0"
            priority
          />
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            Draft <span className="text-blue-400">Whisperer</span>
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
            Draft Simulator
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white ml-auto"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
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
