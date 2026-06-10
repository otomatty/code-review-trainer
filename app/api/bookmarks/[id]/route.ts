import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  if (typeof body.is_read === "boolean") {
    if (body.is_read) {
      db.prepare(
        "UPDATE bookmarks SET is_read = 1, read_at = datetime('now') WHERE id = ?"
      ).run(id);
      // 読了も学習ログに記録 (読む習慣化)
      const today = new Date().toISOString().slice(0, 10);
      const bm = db.prepare("SELECT title FROM bookmarks WHERE id = ?").get(id) as
        | { title: string }
        | undefined;
      db.prepare(
        "INSERT INTO study_logs (exercise_id, submission_id, studied_on, memo) VALUES (NULL, NULL, ?, ?)"
      ).run(today, `PR読了: ${bm?.title ?? ""}`);
    } else {
      db.prepare("UPDATE bookmarks SET is_read = 0, read_at = NULL WHERE id = ?").run(id);
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  getDb().prepare("DELETE FROM bookmarks WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
