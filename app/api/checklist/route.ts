import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const rows = getDb()
    .prepare("SELECT * FROM checklist_items ORDER BY category, id")
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const category = body.category?.trim();
  const label = body.label?.trim();
  if (!category || !label) {
    return NextResponse.json({ error: "カテゴリとラベルは必須です" }, { status: 400 });
  }
  const result = getDb()
    .prepare("INSERT INTO checklist_items (category, label, active) VALUES (?, ?, 1)")
    .run(category, label);
  return NextResponse.json({ id: result.lastInsertRowid });
}
