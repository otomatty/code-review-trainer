import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const patch: { active?: boolean; label?: string } = {};
  if (typeof body.active === "boolean" || typeof body.active === "number") {
    patch.active = !!body.active;
  }
  if (typeof body.label === "string" && body.label.trim()) {
    patch.label = body.label.trim();
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("checklist_items")
      .update(patch)
      .eq("id", Number(id));
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("checklist_items").delete().eq("id", Number(id));
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
