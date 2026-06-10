import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface SubmitComment {
  file_path: string;
  line_no: number;
  checklist_item_id: number | null;
  category: string | null;
  body: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exercise_id, duration_min, self_score, comments, memo } = body as {
    exercise_id: number;
    duration_min: number | null;
    self_score: number | null;
    comments: SubmitComment[];
    memo?: string;
  };

  if (!exercise_id) {
    return NextResponse.json({ error: "exercise_id は必須です" }, { status: 400 });
  }

  const db = getDb();
  const exercise = db.prepare("SELECT id FROM exercises WHERE id = ?").get(exercise_id);
  if (!exercise) {
    return NextResponse.json({ error: "演習が見つかりません" }, { status: 404 });
  }

  let submissionId = 0;
  const tx = db.transaction(() => {
    const result = db
      .prepare(
        "INSERT INTO review_submissions (exercise_id, duration_min, self_score) VALUES (?, ?, ?)"
      )
      .run(exercise_id, duration_min ?? null, self_score ?? null);
    submissionId = result.lastInsertRowid as number;

    const insertComment = db.prepare(
      "INSERT INTO review_comments (submission_id, checklist_item_id, file_path, line_no, body) VALUES (?, ?, ?, ?, ?)"
    );
    for (const c of comments ?? []) {
      insertComment.run(
        submissionId,
        c.checklist_item_id ?? null,
        c.file_path,
        c.line_no,
        c.body
      );
    }

    // 学習ログを自動生成 (US-06)
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(
      "INSERT INTO study_logs (exercise_id, submission_id, studied_on, memo) VALUES (?, ?, ?, ?)"
    ).run(exercise_id, submissionId, today, memo?.trim() || null);
  });
  tx();

  return NextResponse.json({ id: submissionId });
}
