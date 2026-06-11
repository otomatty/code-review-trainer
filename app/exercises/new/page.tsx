"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewExercisePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"github_pr" | "manual">("github_pr");
  const [prUrl, setPrUrl] = useState("");
  const [title, setTitle] = useState("");
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const payload =
        tab === "github_pr"
          ? { source_type: "github_pr", pr_url: prUrl, title }
          : { source_type: "manual", title, diff_content: diff };
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "登録に失敗しました");
        return;
      }
      router.push(`/exercises/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">題材を登録</h1>

      <div className="flex gap-2">
        <TabButton active={tab === "github_pr"} onClick={() => setTab("github_pr")}>
          GitHub PRから取り込む
        </TabButton>
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
          コードを手動登録
        </TabButton>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        {tab === "github_pr" ? (
          <div className="space-y-4">
            <Field label="PR URL *">
              <input
                type="url"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </Field>
            <Field label="タイトル (省略時はPRタイトルを使用)">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </Field>
            <p className="text-xs text-slate-500">
              差分に加えて、マージ済みレビューコメントも「模範レビュー」として自動取得します。
              レート制限を避けるため、設定画面でGitHubトークンの登録を推奨します。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="タイトル *">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: ユーザー認証処理のリファクタリング"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </Field>
            <Field label="差分 (unified diff形式) またはコード *">
              <textarea
                value={diff}
                onChange={(e) => setDiff(e.target.value)}
                rows={16}
                placeholder={`diff --git a/src/auth.ts b/src/auth.ts\n--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -1,5 +1,8 @@\n...`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
              />
            </Field>
            <p className="text-xs text-slate-500">
              `git diff` の出力を貼り付けると行番号付きで表示されます。
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-wrap text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading || (tab === "github_pr" ? !prUrl.trim() : !title.trim() || !diff.trim())}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "取り込み中…" : "登録する"}
        </button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium sm:flex-none ${
        active
          ? "bg-blue-600 text-white"
          : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
