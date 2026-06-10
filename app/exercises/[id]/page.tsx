"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseDiff, DiffFile, DiffLine } from "@/lib/diff";
import { categoryLabel, ChecklistItem, Exercise } from "@/lib/types";

interface DraftComment {
  key: string; // file_path + line_no + index
  file_path: string;
  line_no: number;
  checklist_item_id: number | null;
  body: string;
}

export default function ReviewExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<DraftComment[]>([]);
  const [editingLine, setEditingLine] = useState<{ file: string; line: number } | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const [showSubmit, setShowSubmit] = useState(false);
  const [selfScore, setSelfScore] = useState(3);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 60000));
    }, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/exercises/${id}`).then((r) => r.json()),
      fetch("/api/checklist").then((r) => r.json()),
    ])
      .then(([ex, cl]) => {
        if (ex.error) {
          setError(ex.error);
          return;
        }
        setExercise(ex.exercise);
        setChecklist((cl as ChecklistItem[]).filter((c) => c.active));
      })
      .catch((e) => setError(String(e)));
  }, [id]);

  const diffFiles = useMemo<DiffFile[]>(
    () => (exercise ? parseDiff(exercise.diff_content) : []),
    [exercise]
  );

  const checklistByCategory = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of checklist) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return map;
  }, [checklist]);

  function addComment(file: string, line: number, body: string, checklistItemId: number | null) {
    setComments((prev) => [
      ...prev,
      {
        key: `${file}:${line}:${Date.now()}`,
        file_path: file,
        line_no: line,
        checklist_item_id: checklistItemId,
        body,
      },
    ]);
    setEditingLine(null);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: Number(id),
          duration_min: Math.max(1, Math.floor((Date.now() - startTime.current) / 60000)),
          self_score: selfScore,
          memo,
          comments: comments.map(({ file_path, line_no, checklist_item_id, body }) => ({
            file_path,
            line_no,
            checklist_item_id,
            body,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "提出に失敗しました");
        return;
      }
      router.push(`/results/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提出に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !exercise) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  }
  if (!exercise) {
    return <div className="p-8 text-slate-500">読み込み中…</div>;
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{exercise.title}</h1>
          <div className="mt-1 text-xs text-slate-500">
            行をクリックしてレビューコメントを記入 → 右のパネルから提出
            {exercise.pr_url && (
              <>
                {" ・ "}
                <a
                  href={exercise.pr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  元PRを開く
                </a>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 tabular-nums">
            ⏱ {elapsed}分経過
          </span>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700 tabular-nums">
            💬 指摘 {comments.length}件
          </span>
          <button
            onClick={() => setShowSubmit(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            レビューを提出
          </button>
        </div>
      </header>

      <div className="flex gap-5">
        {/* 差分表示エリア */}
        <div className="min-w-0 flex-1 space-y-4">
          {diffFiles.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              差分を解析できませんでした。unified diff形式で登録されているか確認してください。
            </div>
          ) : (
            diffFiles.map((file) => (
              <FileDiff
                key={file.filePath}
                file={file}
                comments={comments}
                editingLine={editingLine}
                onLineClick={(line) =>
                  setEditingLine(
                    editingLine?.file === file.filePath && editingLine?.line === line
                      ? null
                      : { file: file.filePath, line }
                  )
                }
                onAddComment={addComment}
                onCancel={() => setEditingLine(null)}
                onDeleteComment={(key) =>
                  setComments((prev) => prev.filter((c) => c.key !== key))
                }
                checklistByCategory={checklistByCategory}
              />
            ))
          )}
        </div>

        {/* 観点チェックリスト (US-04: 常時表示) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-4 overflow-y-auto">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-bold">観点チェックリスト</h2>
              <p className="mb-3 text-xs text-slate-500">
                確認した観点にチェックを入れて抜け漏れを防ぎましょう。
              </p>
              {[...checklistByCategory.entries()].map(([category, items]) => (
                <div key={category} className="mb-3">
                  <div className="mb-1 text-xs font-semibold text-slate-600">
                    {categoryLabel(category)}
                  </div>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item.id}>
                        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 text-xs hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={checked.has(item.id)}
                            onChange={() =>
                              setChecked((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              })
                            }
                            className="mt-0.5"
                          />
                          <span
                            className={
                              checked.has(item.id) ? "text-slate-400 line-through" : ""
                            }
                          >
                            {item.label}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 提出モーダル */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">レビューを提出</h2>
            <p className="mt-1 text-sm text-slate-500">
              指摘 {comments.length}件 ・ 所要 約{Math.max(1, elapsed)}分
            </p>

            <div className="mt-4">
              <span className="mb-1 block text-sm font-medium">自己評価</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelfScore(n)}
                    className={`h-10 w-10 rounded-lg border text-sm font-semibold ${
                      selfScore === n
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium">メモ (任意)</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="気づき・難しかった点など"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowSubmit(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                戻る
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "提出中…" : "提出して答え合わせへ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileDiff({
  file,
  comments,
  editingLine,
  onLineClick,
  onAddComment,
  onCancel,
  onDeleteComment,
  checklistByCategory,
}: {
  file: DiffFile;
  comments: DraftComment[];
  editingLine: { file: string; line: number } | null;
  onLineClick: (line: number) => void;
  onAddComment: (file: string, line: number, body: string, checklistItemId: number | null) => void;
  onCancel: () => void;
  onDeleteComment: (key: string) => void;
  checklistByCategory: Map<string, ChecklistItem[]>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const fileComments = comments.filter((c) => c.file_path === file.filePath);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left"
      >
        <span className="truncate font-mono text-sm font-medium text-slate-700">
          {file.filePath}
        </span>
        <span className="ml-2 shrink-0 text-xs text-slate-400">
          {fileComments.length > 0 && `💬 ${fileComments.length}件 ・ `}
          {collapsed ? "展開 ▸" : "折りたたむ ▾"}
        </span>
      </button>
      {!collapsed && (
        <table className="w-full table-fixed border-collapse font-mono text-xs leading-5">
          <tbody>
            {file.lines.map((line, i) => (
              <DiffLineRow
                key={i}
                file={file}
                line={line}
                comments={fileComments}
                isEditing={
                  editingLine?.file === file.filePath &&
                  editingLine?.line === line.commentLineNo &&
                  line.commentLineNo != null
                }
                onLineClick={onLineClick}
                onAddComment={onAddComment}
                onCancel={onCancel}
                onDeleteComment={onDeleteComment}
                checklistByCategory={checklistByCategory}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DiffLineRow({
  file,
  line,
  comments,
  isEditing,
  onLineClick,
  onAddComment,
  onCancel,
  onDeleteComment,
  checklistByCategory,
}: {
  file: DiffFile;
  line: DiffLine;
  comments: DraftComment[];
  isEditing: boolean;
  onLineClick: (line: number) => void;
  onAddComment: (file: string, line: number, body: string, checklistItemId: number | null) => void;
  onCancel: () => void;
  onDeleteComment: (key: string) => void;
  checklistByCategory: Map<string, ChecklistItem[]>;
}) {
  if (line.type === "hunk") {
    return (
      <tr className="bg-sky-50 text-sky-700">
        <td colSpan={3} className="px-3 py-1 select-none">
          {line.content}
        </td>
      </tr>
    );
  }

  const lineComments = comments.filter((c) => c.line_no === line.commentLineNo);
  const bg =
    line.type === "add"
      ? "bg-emerald-50"
      : line.type === "del"
        ? "bg-red-50"
        : "bg-white";
  const marker = line.type === "add" ? "+" : line.type === "del" ? "-" : " ";

  return (
    <>
      <tr
        className={`${bg} cursor-pointer hover:brightness-95`}
        onClick={() => line.commentLineNo != null && onLineClick(line.commentLineNo)}
        title="クリックしてコメント"
      >
        <td className="w-12 border-r border-slate-100 px-2 text-right text-slate-400 select-none">
          {line.oldLineNo ?? ""}
        </td>
        <td className="w-12 border-r border-slate-100 px-2 text-right text-slate-400 select-none">
          {line.newLineNo ?? ""}
        </td>
        <td className="px-3 whitespace-pre-wrap break-all">
          <span className="select-none text-slate-400">{marker} </span>
          {line.content}
        </td>
      </tr>
      {lineComments.map((c) => (
        <tr key={c.key}>
          <td colSpan={3} className="bg-amber-50 px-4 py-2">
            <div className="flex items-start justify-between gap-2 font-sans">
              <div className="min-w-0">
                {c.checklist_item_id != null && (
                  <CategoryBadge
                    checklistItemId={c.checklist_item_id}
                    checklistByCategory={checklistByCategory}
                  />
                )}
                <p className="text-sm whitespace-pre-wrap">{c.body}</p>
              </div>
              <button
                onClick={() => onDeleteComment(c.key)}
                className="shrink-0 text-xs text-slate-400 hover:text-red-500"
              >
                削除
              </button>
            </div>
          </td>
        </tr>
      ))}
      {isEditing && line.commentLineNo != null && (
        <tr>
          <td colSpan={3} className="bg-blue-50/60 px-4 py-3">
            <CommentForm
              checklistByCategory={checklistByCategory}
              onSubmit={(body, itemId) =>
                onAddComment(file.filePath, line.commentLineNo!, body, itemId)
              }
              onCancel={onCancel}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function CategoryBadge({
  checklistItemId,
  checklistByCategory,
}: {
  checklistItemId: number;
  checklistByCategory: Map<string, ChecklistItem[]>;
}) {
  for (const [category, items] of checklistByCategory.entries()) {
    if (items.some((i) => i.id === checklistItemId)) {
      return (
        <span className="mb-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {categoryLabel(category)}
        </span>
      );
    }
  }
  return null;
}

function CommentForm({
  checklistByCategory,
  onSubmit,
  onCancel,
}: {
  checklistByCategory: Map<string, ChecklistItem[]>;
  onSubmit: (body: string, checklistItemId: number | null) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const [itemId, setItemId] = useState<string>("");

  return (
    <div className="space-y-2 font-sans">
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="この行への指摘を書く…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
        >
          <option value="">観点タグを選択 (任意)</option>
          {[...checklistByCategory.entries()].map(([category, items]) => (
            <optgroup key={category} label={categoryLabel(category)}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            onClick={() => body.trim() && onSubmit(body.trim(), itemId ? Number(itemId) : null)}
            disabled={!body.trim()}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            コメントを追加
          </button>
        </div>
      </div>
    </div>
  );
}
