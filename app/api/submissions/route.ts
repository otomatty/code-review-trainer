import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface SubmitComment {
  file_path: string;
  line_no: number;
  checklist_item_id: number | null;
  category: string | null;
  body: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exercise_id, duration_min, self_score, comments, memo } = body as {
    exercise_id: number;
    duration_min: number | null;
    self_score: number | null;
    comments: SubmitComment[];
    memo?: string;
  };

  if (!exercise_id) {
    return NextResponse.json({ error: "exercise_id は必須です" }, { status: 400 });
  }

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", exercise_id)
    .maybeSingle();
  if (!exercise) {
    return NextResponse.json({ error: "演習が見つかりません" }, { status: 404 });
  }

  // 提出 + 行コメント + 学習ログを 1 トランザクションで登録する (RPC)
  const { data: submissionId, error } = await supabase.rpc("submit_review", {
    p_exercise_id: exercise_id,
    // 関数の引数は NULL 許容だが生成型は number 固定のためキャストする
    p_duration_min: (duration_min ?? null) as number,
    p_self_score: (self_score ?? null) as number,
    p_comments: (comments ?? []).map((c) => ({
      file_path: c.file_path,
      line_no: c.line_no,
      checklist_item_id: c.checklist_item_id ?? null,
      body: c.body,
    })),
    p_memo: (memo ?? null) as string,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: submissionId });
}
