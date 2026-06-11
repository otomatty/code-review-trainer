import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseId } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exerciseId = parseId(id);
  if (exerciseId === null) {
    return NextResponse.json({ error: "IDが不正です" }, { status: 400 });
  }

  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();
  if (exerciseError) {
    return NextResponse.json({ error: exerciseError.message }, { status: 500 });
  }
  if (!exercise) {
    return NextResponse.json({ error: "演習が見つかりません" }, { status: 404 });
  }

  const [
    { data: modelComments, error: modelCommentsError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
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

  const queryError = modelCommentsError ?? submissionsError;
  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  return NextResponse.json({ exercise, modelComments, submissions });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exerciseId = parseId(id);
  if (exerciseId === null) {
    return NextResponse.json({ error: "IDが不正です" }, { status: 400 });
  }
  const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
