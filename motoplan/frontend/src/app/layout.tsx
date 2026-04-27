import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Мото-План",
  description: "Планирование совместных поездок мотоклуба",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold">
                Мото-План
              </Link>
              <nav className="flex gap-4">
                <Link href="/calendar">
                  <Button variant="ghost">Календарь</Button>
                </Link>
                <Link href="/events">
                  <Button variant="ghost">Поездки</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost">Профиль</Button>
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}