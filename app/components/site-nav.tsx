"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", mobileLabel: "ホーム", icon: "📊" },
  { href: "/exercises", label: "演習一覧", mobileLabel: "演習", icon: "📝" },
  { href: "/logs", label: "学習ログ", mobileLabel: "ログ", icon: "📅" },
  { href: "/bookmarks", label: "PRブックマーク", mobileLabel: "PR", icon: "🔖" },
  { href: "/settings", label: "設定", mobileLabel: "設定", icon: "⚙️" },
];

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-2 space-y-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            isActive(pathname, item.href)
              ? "bg-blue-50 text-blue-700"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {/* grid-cols-5 は NAV_ITEMS の項目数と一致させること */}
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              isActive(pathname, item.href) ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.mobileLabel}
          </Link>
        ))}
      </div>
    </nav>
  );
}
