import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const exercise = db.prepare("SELECT * FROM exercises WHERE id = ?").get(id);
  if (!exercise) {
    return NextResponse.json({ error: "演習が見つかりません" }, { status: 404 });
  }
  const modelComments = db
    .prepare("SELECT * FROM model_review_comments WHERE exercise_id = ? ORDER BY file_path, line_no")
    .all(id);
  const submissions = db
    .prepare("SELECT * FROM review_submissions WHERE exercise_id = ? ORDER BY submitted_at DESC")
    .all(id);
  return NextResponse.json({ exercise, modelComments, submissions });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  getDb().prepare("DELETE FROM exercises WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
