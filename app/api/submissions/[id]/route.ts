import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const submissionId = Number(id);

  const { data: submission } = await supabase
    .from("review_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) {
    return NextResponse.json({ error: "提出が見つかりません" }, { status: 404 });
  }

  const [{ data: exercise }, { data: comments }, { data: modelComments }, { data: aiFeedback }] =
    await Promise.all([
      supabase.from("exercises").select("*").eq("id", submission.exercise_id).maybeSingle(),
      supabase
        .from("review_comment_view")
        .select("*")
        .eq("submission_id", submissionId)
        .order("file_path")
        .order("line_no"),
      supabase
        .from("model_review_comments")
        .select("*")
        .eq("exercise_id", submission.exercise_id)
        .order("file_path")
        .order("line_no"),
      supabase
        .from("ai_feedback")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return NextResponse.json({ submission, exercise, comments, modelComments, aiFeedback });
}
