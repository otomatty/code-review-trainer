import Link from "next/link";
import { getDb } from "@/lib/db";
import { calcStreak, studiedDates } from "@/lib/streak";

export const dynamic = "force-dynamic";

interface LogRow {
  id: number;
  studied_on: string;
  memo: string | null;
  submission_id: number | null;
  title: string | null;
  duration_min: number | null;
  self_score: number | null;
}

function buildMonth(year: number, month: number, studied: Set<string>) {
  // month: 0-11
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = first.getUTCDay(); // 0=日

  const cells: { day: number | null; dateStr: string | null; studied: boolean }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, dateStr: null, studied: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, studied: studied.has(dateStr) });
  }
  return cells;
}

export default function LogsPage() {
  const db = getDb();
  const streak = calcStreak();
  const studied = new Set(studiedDates());

  const logs = db
    .prepare(
      `SELECT l.id, l.studied_on, l.memo, l.submission_id,
              e.title, s.duration_min, s.self_score
       FROM study_logs l
       LEFT JOIN exercises e ON e.id = l.exercise_id
       LEFT JOIN review_submissions s ON s.id = l.submission_id
       ORDER BY l.studied_on DESC, l.id DESC
       LIMIT 100`
    )
    .all() as LogRow[];

  const now = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const todayStr = now.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">学習ログ</h1>
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          🔥 ストリーク {streak}日
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {months.map(({ year, month }) => {
          const cells = buildMonth(year, month, studied);
          return (
            <div key={`${year}-${month}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-center text-sm font-semibold">
                {year}年{month + 1}月
              </h2>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
                  <div key={w} className="py-1 text-slate-400">
                    {w}
                  </div>
                ))}
                {cells.map((cell, i) => (
                  <div
                    key={i}
                    className={`flex h-7 items-center justify-center rounded ${
                      cell.day == null
                        ? ""
                        : cell.studied
                          ? "bg-emerald-400 font-semibold text-white"
                          : cell.dateStr === todayStr
                            ? "bg-slate-100 font-semibold"
                            : "text-slate-600"
                    }`}
                  >
                    {cell.day ?? ""}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-5 py-3 font-semibold">履歴</h2>
        {logs.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            まだ記録がありません。演習を提出すると自動で記録されます。
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                <span className="w-20 shrink-0 text-xs tabular-nums text-slate-500 sm:w-24 sm:text-sm">
                  {log.studied_on}
                </span>
                <div className="min-w-0 flex-1">
                  {log.submission_id ? (
                    <Link
                      href={`/results/${log.submission_id}`}
                      className="block truncate text-sm font-medium text-slate-800 hover:text-blue-600"
                    >
                      演習: {log.title ?? "(削除済み)"}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {log.memo ?? "学習記録"}
                    </span>
                  )}
                  {log.submission_id && log.memo && (
                    <p className="truncate text-xs text-slate-500">{log.memo}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {log.duration_min != null && `${log.duration_min}分`}
                  {log.self_score != null && ` ・ ${log.self_score}/5`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
