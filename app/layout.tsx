import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DraftWhisperer — Hero Stats, Counter & Synergy",
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
            © 2026 DraftWhisperer
          </p>
        </footer>
      </body>
    </html>
  );
}
