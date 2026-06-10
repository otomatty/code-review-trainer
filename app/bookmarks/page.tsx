"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "@/lib/types";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/bookmarks");
    setBookmarks(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pr_url: url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "追加に失敗しました");
        return;
      }
      setUrl("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function toggleRead(b: Bookmark) {
    await fetch(`/api/bookmarks/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: !b.is_read }),
    });
    await load();
  }

  async function remove(id: number) {
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    await load();
  }

  const unread = bookmarks.filter((b) => !b.is_read);
  const read = bookmarks.filter((b) => b.is_read);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">PRブックマーク</h1>
        <p className="mt-1 text-sm text-slate-500">
          「読むべきPR」を貯めて、読了管理でレビューを読む習慣を作りましょう。読了は学習ログに記録されます。
        </p>
      </header>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && url.trim() && add()}
          placeholder="https://github.com/owner/repo/pull/123"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={loading || !url.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          追加
        </button>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <BookmarkList title={`未読 (${unread.length})`} items={unread} onToggle={toggleRead} onRemove={remove} />
      <BookmarkList title={`読了 (${read.length})`} items={read} onToggle={toggleRead} onRemove={remove} />
    </div>
  );
}

function BookmarkList({
  title,
  items,
  onToggle,
  onRemove,
}: {
  title: string;
  items: Bookmark[];
  onToggle: (b: Bookmark) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 px-5 py-3 text-sm font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="p-5 text-sm text-slate-400">なし</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-5 py-3">
              <input
                type="checkbox"
                checked={!!b.is_read}
                onChange={() => onToggle(b)}
                title={b.is_read ? "未読に戻す" : "読了にする"}
                className="h-4 w-4 cursor-pointer"
              />
              <a
                href={b.pr_url}
                target="_blank"
                rel="noreferrer"
                className={`min-w-0 flex-1 truncate text-sm font-medium hover:text-blue-600 ${
                  b.is_read ? "text-slate-400 line-through" : "text-slate-800"
                }`}
              >
                {b.title}
              </a>
              <span className="shrink-0 text-xs text-slate-400">
                {b.is_read && b.read_at ? `読了 ${b.read_at.slice(0, 10)}` : b.created_at.slice(0, 10)}
              </span>
              <button
                onClick={() => onRemove(b.id)}
                className="shrink-0 text-xs text-slate-400 hover:text-red-500"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
