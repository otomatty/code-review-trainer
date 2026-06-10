import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  if (typeof body.active === "boolean" || typeof body.active === "number") {
    db.prepare("UPDATE checklist_items SET active = ? WHERE id = ?").run(
      body.active ? 1 : 0,
      id
    );
  }
  if (typeof body.label === "string" && body.label.trim()) {
    db.prepare("UPDATE checklist_items SET label = ? WHERE id = ?").run(
      body.label.trim(),
      id
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  getDb().prepare("DELETE FROM checklist_items WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
