import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MLBB Analytics — Hero Stats, Counter & Synergy",
  description:
    "Analitik hero Mobile Legends: Bang Bang — Win Rate, Ban Rate, Counter, dan Synergy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#0d0f17] text-white min-h-screen antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-white/5 mt-20 py-10 text-center text-sm text-gray-500">
          <p>
            © 2026 MLBB Analytics — Data dari{" "}
            <a
              href="https://mlbb-stats.rone.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline"
            >
              mlbb-stats.rone.dev
            </a>{" "}
            oleh ridwaanhall. Tidak berafiliasi dengan Moonton.
          </p>
        </footer>
      </body>
    </html>
  );
}
