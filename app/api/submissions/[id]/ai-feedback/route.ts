import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateAiFeedback } from "@/lib/ai";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const submission = db
    .prepare("SELECT * FROM review_submissions WHERE id = ?")
    .get(id) as { id: number; exercise_id: number } | undefined;
  if (!submission) {
    return NextResponse.json({ error: "提出が見つかりません" }, { status: 404 });
  }

  const exercise = db
    .prepare("SELECT diff_content FROM exercises WHERE id = ?")
    .get(submission.exercise_id) as { diff_content: string };

  const comments = db
    .prepare(
      `SELECT rc.file_path, rc.line_no, rc.body, ci.category
       FROM review_comments rc
       LEFT JOIN checklist_items ci ON ci.id = rc.checklist_item_id
       WHERE rc.submission_id = ?`
    )
    .all(id) as { file_path: string; line_no: number; body: string; category: string | null }[];

  try {
    const feedback = await generateAiFeedback({
      diff: exercise.diff_content,
      userComments: comments,
    });

    db.prepare(
      "INSERT INTO ai_feedback (submission_id, scores_by_category, commentary) VALUES (?, ?, ?)"
    ).run(id, JSON.stringify(feedback.scores), feedback.commentary);

    return NextResponse.json(feedback);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AIフィードバックの生成に失敗しました" },
      { status: 500 }
    );
  }
}
