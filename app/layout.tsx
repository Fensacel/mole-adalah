import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Draft Whisperer — Hero Stats, Counter & Synergy",
  description:
    "Mobile Legends: Bang Bang hero analytics — Win Rate, Ban Rate, Counter, and Synergy.",
  icons: {
    icon: [{ url: "/logo.webp", type: "image/webp" }],
    shortcut: [{ url: "/logo.webp", type: "image/webp" }],
    apple: [{ url: "/logo.webp", type: "image/webp" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="mt-20 border-t border-white/5 py-12 text-center tracking-wide">
          <div className="flex flex-col items-center gap-4">

            {/* Copyright & Tagline */}
            <div className="space-y-1">
              <p className="text-[11px] text-gray-600">
                &copy; {new Date().getFullYear()} Draft Whisperer — All rights reserved.
              </p>
            </div>

            {/* Support Me Link */}
            <a
              href="https://bio.mfchmufid.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-gray-500 hover:text-white transition-colors duration-200 flex items-center gap-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Support Me
            </a>

          </div>
        </footer>
      </body>
    </html>
  );
}
