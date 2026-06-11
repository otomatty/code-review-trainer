import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calcStreak } from "@/lib/streak";
import { categoryLabel, CHECKLIST_CATEGORIES, formatDateTime, AiScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    streak,
    { count: totalSubmissions, error: submissionsError },
    { count: totalExercises, error: exercisesError },
    { data: weekly, error: weeklyError },
    { data: recent, error: recentError },
    { data: feedbackRows, error: feedbackError },
  ] = await Promise.all([
    calcStreak(),
    supabase.from("review_submissions").select("*", { count: "exact", head: true }),
    supabase.from("exercises").select("*", { count: "exact", head: true }),
    supabase.from("weekly_study_days_view").select("days").maybeSingle(),
    supabase
      .from("recent_submission_view")
      .select("id, submitted_at, duration_min, self_score, title, comment_count")
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase.from("ai_feedback").select("scores_by_category"),
  ]);

  const dashboardError =
    submissionsError ?? exercisesError ?? weeklyError ?? recentError ?? feedbackError;
  if (dashboardError) {
    throw new Error(`ダッシュボードの取得に失敗しました: ${dashboardError.message}`);
  }

  const thisWeek = weekly?.days ?? 0;
  const recentList = recent ?? [];

  // 弱点サマリ: AIフィードバックの観点別平均スコア (F-08 簡易版)
  // jsonb は型保証がないため、各要素の構造を実行時に検証してから集計する。
  const isAiScore = (v: unknown): v is AiScore =>
    typeof v === "object" &&
    v !== null &&
    typeof (v as AiScore).category === "string" &&
    typeof (v as AiScore).score === "number";

  const categoryScores = new Map<string, number[]>();
  for (const row of feedbackRows ?? []) {
    const scores = row.scores_by_category;
    if (!Array.isArray(scores)) continue;
    for (const s of scores) {
      if (!isAiScore(s)) continue;
      if (!categoryScores.has(s.category)) categoryScores.set(s.category, []);
      categoryScores.get(s.category)!.push(s.score);
    }
  }
  const weakness = CHECKLIST_CATEGORIES.map((c) => {
    const arr = categoryScores.get(c.key) ?? [];
    const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    return { key: c.key, label: c.label, avg, count: arr.length };
  }).sort((a, b) => (a.avg ?? 6) - (b.avg ?? 6));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link
          href="/exercises"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          演習をはじめる →
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard label="🔥 ストリーク" value={`${streak}日`} highlight={streak >= 3} />
        <StatCard label="今週の学習日数" value={`${thisWeek} / 7日`} highlight={thisWeek >= 3} />
        <StatCard label="演習提出回数" value={`${totalSubmissions ?? 0}回`} />
        <StatCard label="登録題材数" value={`${totalExercises ?? 0}件`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">直近の演習</h2>
          {recentList.length === 0 ? (
            <p className="text-sm text-slate-500">
              まだ演習がありません。
              <Link href="/exercises" className="text-blue-600 underline">
                題材を登録
              </Link>
              して最初のレビュー演習を始めましょう。
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentList.map((s) => (
                <li key={s.id} className="py-2.5">
                  <Link href={`/results/${s.id}`} className="group block">
                    <div className="font-medium text-slate-800 group-hover:text-blue-600">
                      {s.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {formatDateTime(s.submitted_at)} ・ 指摘 {s.comment_count ?? 0}件
                      {s.duration_min != null && ` ・ ${s.duration_min}分`}
                      {s.self_score != null && ` ・ 自己評価 ${s.self_score}/5`}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">弱点サマリ (AI採点の観点別平均)</h2>
          {(feedbackRows ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">
              AIフィードバックを実行すると、観点別の弱点がここに表示されます。
            </p>
          ) : (
            <ul className="space-y-2.5">
              {weakness.map((w) => (
                <li key={w.key} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs sm:w-36 sm:text-sm">
                    {categoryLabel(w.key)}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    {w.avg != null && (
                      <div
                        className={`h-full rounded-full ${
                          w.avg < 2.5 ? "bg-red-400" : w.avg < 4 ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${(w.avg / 5) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="w-14 shrink-0 text-right text-sm tabular-nums text-slate-600">
                    {w.avg != null ? w.avg.toFixed(1) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
