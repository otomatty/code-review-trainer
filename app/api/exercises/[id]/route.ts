import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exerciseId = Number(id);

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();
  if (!exercise) {
    return NextResponse.json({ error: "演習が見つかりません" }, { status: 404 });
  }

  const [{ data: modelComments }, { data: submissions }] = await Promise.all([
    supabase
      .from("model_review_comments")
      .select("*")
      .eq("exercise_id", exerciseId)
      .order("file_path")
      .order("line_no"),
    supabase
      .from("review_submissions")
      .select("*")
      .eq("exercise_id", exerciseId)
      .order("submitted_at", { ascending: false }),
  ]);

  return NextResponse.json({ exercise, modelComments, submissions });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("exercises").delete().eq("id", Number(id));
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
