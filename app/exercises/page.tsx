import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const { data: rows } = await supabase
    .from("exercise_list_view")
    .select("id, title, source_type, pr_url, created_at, submission_count, model_comment_count")
    .order("created_at", { ascending: false });

  const exercises = rows ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">演習一覧</h1>
        <Link
          href="/exercises/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 題材を登録
        </Link>
      </header>

      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <p className="mb-3">題材がまだ登録されていません。</p>
          <p className="text-sm">
            GitHubのPR URLを取り込むか、サンプルコードを手動で登録して演習を始めましょう。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {exercises.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:gap-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/exercises/${e.id}`}
                  className="block truncate font-semibold text-slate-800 hover:text-blue-600"
                >
                  {e.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      e.source_type === "github_pr"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {e.source_type === "github_pr" ? "GitHub PR" : "手動登録"}
                  </span>
                  <span>{formatDateTime(e.created_at)}</span>
                  <span>提出 {e.submission_count ?? 0}回</span>
                  {(e.model_comment_count ?? 0) > 0 && (
                    <span>模範コメント {e.model_comment_count}件</span>
                  )}
                </div>
              </div>
              <Link
                href={`/exercises/${e.id}`}
                className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                演習する
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
