import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseId } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const submissionId = parseId(id);
  if (submissionId === null) {
    return NextResponse.json({ error: "IDが不正です" }, { status: 400 });
  }

  const { data: submission, error: submissionError } = await supabase
    .from("review_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (submissionError) {
    return NextResponse.json({ error: submissionError.message }, { status: 500 });
  }
  if (!submission) {
    return NextResponse.json({ error: "提出が見つかりません" }, { status: 404 });
  }

  const [
    { data: exercise, error: exerciseError },
    { data: comments, error: commentsError },
    { data: modelComments, error: modelCommentsError },
    { data: aiFeedback, error: aiFeedbackError },
  ] = await Promise.all([
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

  // 画面表示に必須のクエリでエラーが出たら 500 を返す
  // (Supabase はエラー時に reject せず error を返すため明示的に確認する)
  const queryError = exerciseError ?? commentsError ?? modelCommentsError ?? aiFeedbackError;
  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  return NextResponse.json({ submission, exercise, comments, modelComments, aiFeedback });
}
