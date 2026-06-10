import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const submission = db
    .prepare("SELECT * FROM review_submissions WHERE id = ?")
    .get(id);
  if (!submission) {
    return NextResponse.json({ error: "提出が見つかりません" }, { status: 404 });
  }
  const exercise = db
    .prepare("SELECT * FROM exercises WHERE id = ?")
    .get((submission as { exercise_id: number }).exercise_id);
  const comments = db
    .prepare(
      `SELECT rc.*, ci.category, ci.label AS checklist_label
       FROM review_comments rc
       LEFT JOIN checklist_items ci ON ci.id = rc.checklist_item_id
       WHERE rc.submission_id = ?
       ORDER BY rc.file_path, rc.line_no`
    )
    .all(id);
  const modelComments = db
    .prepare(
      "SELECT * FROM model_review_comments WHERE exercise_id = ? ORDER BY file_path, line_no"
    )
    .all((submission as { exercise_id: number }).exercise_id);
  const aiFeedback = db
    .prepare("SELECT * FROM ai_feedback WHERE submission_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(id);

  return NextResponse.json({ submission, exercise, comments, modelComments, aiFeedback });
}
