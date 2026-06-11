"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  categoryLabel,
  formatDateTime,
  AiScore,
  Exercise,
  ModelReviewComment,
  ReviewSubmission,
} from "@/lib/types";

interface OwnComment {
  id: number;
  file_path: string;
  line_no: number;
  body: string;
  category: string | null;
  checklist_label: string | null;
}

interface AiFeedbackRow {
  scores_by_category: AiScore[];
  commentary: string;
  created_at: string;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<{
    submission: ReviewSubmission;
    exercise: Exercise;
    comments: OwnComment[];
    modelComments: ModelReviewComment[];
    aiFeedback: AiFeedbackRow | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/submissions/${id}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "読み込みに失敗しました");
      return;
    }
    setData(json);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function requestAiFeedback() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/submissions/${id}/ai-feedback`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error ?? "AIフィードバックの生成に失敗しました");
        return;
      }
      await load();
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AIフィードバックの生成に失敗しました");
    } finally {
      setAiLoading(false);
    }
  }

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  }
  if (!data) {
    return <div className="p-8 text-slate-500">読み込み中…</div>;
  }

  const { submission, exercise, comments, modelComments, aiFeedback } = data;
  const aiScores: AiScore[] = aiFeedback?.scores_by_category ?? [];

  // 行単位の対比のため、ファイル+行でグルーピング
  const allKeys = new Set<string>();
  for (const c of comments) allKeys.add(`${c.file_path}:${c.line_no}`);
  for (const m of modelComments) allKeys.add(`${m.file_path}:${m.line_no ?? "-"}`);
  const sortedKeys = [...allKeys].sort();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">結果比較</h1>
          <p className="mt-1 text-sm text-slate-500">
            {exercise.title} ・ {formatDateTime(submission.submitted_at)}
            {submission.duration_min != null && ` ・ ${submission.duration_min}分`}
            {submission.self_score != null && ` ・ 自己評価 ${submission.self_score}/5`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/exercises/${exercise.id}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ↻ 再挑戦
          </Link>
          <Link
            href="/logs"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            学習ログへ
          </Link>
        </div>
      </header>

      {/* 行単位の対比 (US-05) */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-2 border-b border-slate-200 bg-slate-50 text-sm font-semibold sm:grid">
          <div className="px-4 py-2.5">
            あなたの指摘 <span className="font-normal text-slate-500">({comments.length}件)</span>
          </div>
          <div className="border-l border-slate-200 px-4 py-2.5">
            模範レビュー{" "}
            <span className="font-normal text-slate-500">({modelComments.length}件)</span>
          </div>
        </div>
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold sm:hidden">
          あなたの指摘 ({comments.length}件) と模範レビュー ({modelComments.length}件)
        </div>
        {sortedKeys.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            コメントがありません。
            {exercise.source_type === "manual" &&
              " 手動登録の題材には模範レビューがないため、AIフィードバックを活用しましょう。"}
          </div>
        ) : (
          sortedKeys.map((key) => {
            const own = comments.filter((c) => `${c.file_path}:${c.line_no}` === key);
            const model = modelComments.filter(
              (m) => `${m.file_path}:${m.line_no ?? "-"}` === key
            );
            return (
              <div key={key} className="border-b border-slate-100 last:border-b-0">
                <div className="bg-slate-50/60 px-4 py-1.5 font-mono text-xs text-slate-500">
                  {key}
                </div>
                <div className="grid sm:grid-cols-2">
                  <div className="space-y-2 p-4">
                    <div className="text-xs font-semibold text-slate-500 sm:hidden">
                      あなたの指摘
                    </div>
                    {own.length === 0 ? (
                      <p className="text-xs text-red-400">指摘なし (見逃し?)</p>
                    ) : (
                      own.map((c) => (
                        <div key={c.id} className="rounded-lg bg-blue-50 p-3">
                          {c.category && (
                            <span className="mb-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {categoryLabel(c.category)}
                            </span>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2 border-t border-slate-100 p-4 sm:border-t-0 sm:border-l">
                    <div className="text-xs font-semibold text-slate-500 sm:hidden">
                      模範レビュー
                    </div>
                    {model.length === 0 ? (
                      <p className="text-xs text-slate-400">—</p>
                    ) : (
                      model.map((m) => (
                        <div key={m.id} className="rounded-lg bg-emerald-50 p-3">
                          <div className="mb-1 text-xs font-medium text-emerald-700">
                            @{m.author}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* AIフィードバック (US-07) */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">🤖 AIフィードバック</h2>
          <button
            onClick={requestAiFeedback}
            disabled={aiLoading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {aiLoading ? "採点中… (1〜2分かかることがあります)" : aiFeedback ? "再採点する" : "AIに採点してもらう"}
          </button>
        </div>

        {aiError && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm whitespace-pre-wrap text-red-700">
            {aiError}
          </div>
        )}

        {aiFeedback ? (
          <div className="mt-4 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {aiScores.map((s) => (
                <div key={s.category} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{categoryLabel(s.category)}</span>
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        s.score <= 2
                          ? "text-red-500"
                          : s.score <= 3
                            ? "text-amber-500"
                            : "text-emerald-600"
                      }`}
                    >
                      {s.score}/5
                    </span>
                  </div>
                  {s.missed_points.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                      {s.missed_points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-violet-50 p-4">
              <h3 className="mb-2 text-sm font-bold text-violet-800">講評</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                {aiFeedback.commentary}
              </p>
            </div>
          </div>
        ) : (
          !aiLoading && (
            <p className="mt-3 text-sm text-slate-500">
              Claude APIで指摘の抜け漏れを観点別に採点・講評します。設定画面でAPIキーを登録してください。
            </p>
          )
        )}
      </section>
    </div>
  );
}
