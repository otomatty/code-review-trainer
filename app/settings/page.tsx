"use client";

import { useEffect, useState } from "react";
import { categoryLabel, ChecklistItem, CHECKLIST_CATEGORIES } from "@/lib/types";

interface SettingsView {
  github_token: string | null;
  anthropic_api_key: string | null;
  github_token_env: boolean;
  anthropic_api_key_env: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [saved, setSaved] = useState(false);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCategory, setNewCategory] = useState<string>(CHECKLIST_CATEGORIES[0].key);
  const [newLabel, setNewLabel] = useState("");

  async function load() {
    const [s, c] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/checklist").then((r) => r.json()),
    ]);
    setSettings(s);
    setChecklist(c);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveTokens() {
    const body: Record<string, string> = {};
    if (githubToken) body.github_token = githubToken;
    if (anthropicKey) body.anthropic_api_key = anthropicKey;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setGithubToken("");
    setAnthropicKey("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await load();
  }

  async function toggleItem(item: ChecklistItem) {
    await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    await load();
  }

  async function deleteItem(id: number) {
    await fetch(`/api/checklist/${id}`, { method: "DELETE" });
    await load();
  }

  async function addItem() {
    if (!newLabel.trim()) return;
    await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCategory, label: newLabel.trim() }),
    });
    setNewLabel("");
    await load();
  }

  const byCategory = new Map<string, ChecklistItem[]>();
  for (const item of checklist) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category)!.push(item);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">設定</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="font-semibold">APIトークン</h2>
        <p className="mt-1 text-xs text-slate-500">
          トークンはローカルのSQLiteに保存されます。環境変数 (GITHUB_TOKEN / ANTHROPIC_API_KEY) でも設定できます。
        </p>

        <div className="mt-4 space-y-4">
          <TokenField
            label="GitHubトークン (PR取り込み用)"
            current={settings?.github_token ?? null}
            envSet={settings?.github_token_env ?? false}
            value={githubToken}
            onChange={setGithubToken}
            placeholder="ghp_… / github_pat_…"
          />
          <TokenField
            label="Anthropic APIキー (AIフィードバック用)"
            current={settings?.anthropic_api_key ?? null}
            envSet={settings?.anthropic_api_key_env ?? false}
            value={anthropicKey}
            onChange={setAnthropicKey}
            placeholder="sk-ant-…"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveTokens}
            disabled={!githubToken && !anthropicKey}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            保存
          </button>
          {saved && <span className="text-sm text-emerald-600">保存しました ✓</span>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="font-semibold">観点チェックリストの編集</h2>
        <p className="mt-1 text-xs text-slate-500">
          無効化した項目は演習画面に表示されません。自分の学習方針に合わせて追加・整理しましょう。
        </p>

        <div className="mt-4 space-y-5">
          {[...byCategory.entries()].map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold text-slate-600">
                {categoryLabel(category)}
              </h3>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!item.active}
                      onChange={() => toggleItem(item)}
                      title={item.active ? "無効化" : "有効化"}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <span className={item.active ? "" : "text-slate-400 line-through"}>
                      {item.label}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="ml-auto text-xs text-slate-400 hover:text-red-500"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {CHECKLIST_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="新しい観点項目を追加…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={addItem}
            disabled={!newLabel.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>
    </div>
  );
}

function TokenField({
  label,
  current,
  envSet,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  current: string | null;
  envSet: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <span className="mt-1 block text-xs text-slate-500">
        {current ? `登録済み: ${current}` : envSet ? "環境変数で設定済み" : "未設定"}
      </span>
    </label>
  );
}
