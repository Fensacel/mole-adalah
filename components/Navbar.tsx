"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/heroes", label: "Hero" },
    { href: "/items", label: "Item" },
    { href: "/rankings", label: "Rankings" },
    { href: "/draftsimulator", label: "Draft Simulator" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d0f17]/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 md:h-[72px] flex items-center gap-3 md:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 md:gap-2.5 shrink-0">
          <Image
            src="/logo.webp"
            alt="Draft Whisperer"
            width={72}
            height={72}
            className="h-10 w-10 sm:h-11 sm:w-11 md:h-16 md:w-16 object-contain shrink-0"
            priority
          />
          <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight">
            Draft <span className="text-blue-400">Whisperer</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 text-sm text-gray-400 ml-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? "text-white bg-white/10"
                    : "hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden ml-auto inline-flex items-center justify-center h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-black/45" onClick={() => setMenuOpen(false)}>
          <nav
            className="mx-3 mt-2 rounded-xl border border-white/10 bg-[#111522] p-2 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-500/20 text-blue-300"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
