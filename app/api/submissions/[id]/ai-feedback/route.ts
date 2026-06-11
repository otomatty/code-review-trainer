import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateAiFeedback } from "@/lib/ai";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const submissionId = Number(id);

  const { data: submission } = await supabase
    .from("review_submissions")
    .select("id, exercise_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) {
    return NextResponse.json({ error: "提出が見つかりません" }, { status: 404 });
  }

  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("diff_content")
    .eq("id", submission.exercise_id)
    .single();
  if (exerciseError || !exercise) {
    return NextResponse.json(
      { error: exerciseError?.message ?? "演習データが見つかりません" },
      { status: 500 }
    );
  }

  const { data: comments, error: commentsError } = await supabase
    .from("review_comment_view")
    .select("file_path, line_no, body, category")
    .eq("submission_id", submissionId);
  if (commentsError) {
    return NextResponse.json({ error: commentsError.message }, { status: 500 });
  }

  try {
    const feedback = await generateAiFeedback({
      diff: exercise.diff_content,
      userComments: (comments ?? []).map((c) => ({
        file_path: c.file_path ?? "",
        line_no: c.line_no ?? 0,
        body: c.body ?? "",
        category: c.category,
      })),
    });

    const { error } = await supabase.from("ai_feedback").insert({
      submission_id: Number(id),
      scores_by_category: feedback.scores,
      commentary: feedback.commentary,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json(feedback);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AIフィードバックの生成に失敗しました" },
      { status: 500 }
    );
  }
}
