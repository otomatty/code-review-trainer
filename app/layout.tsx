import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "コードレビュー・トレーナー",
  description: "コードレビュー能力を鍛えるための個人用トレーニングアプリ",
};

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: "📊" },
  { href: "/exercises", label: "演習一覧", icon: "📝" },
  { href: "/logs", label: "学習ログ", icon: "📅" },
  { href: "/bookmarks", label: "PRブックマーク", icon: "🔖" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen">
          <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
            <div className="sticky top-0 p-4">
              <Link href="/" className="block px-2 py-3">
                <span className="text-lg font-bold tracking-tight">
                  Code Review
                  <br />
                  Trainer
                </span>
              </Link>
              <nav className="mt-2 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
          <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
