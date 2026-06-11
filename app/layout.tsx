import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { MobileBottomNav, SidebarNav } from "./components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "コードレビュー・トレーナー",
  description: "コードレビュー能力を鍛えるための個人用トレーニングアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen">
          <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:block">
            <div className="sticky top-0 p-4">
              <Link href="/" className="block px-2 py-3">
                <span className="text-lg font-bold tracking-tight">
                  Code Review
                  <br />
                  Trainer
                </span>
              </Link>
              <SidebarNav />
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
              <Link href="/" className="text-base font-bold tracking-tight">
                Code Review Trainer
              </Link>
            </header>
            <main className="min-w-0 p-4 pb-24 md:p-6 md:pb-8 lg:p-8">
              {children}
            </main>
          </div>
        </div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
