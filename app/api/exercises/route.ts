import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import {
  parsePrUrl,
  fetchPrMeta,
  fetchPrDiff,
  fetchPrReviewComments,
} from "@/lib/github";

export async function GET() {
  const { data, error } = await supabase
    .from("exercise_list_view")
    .select("id, title, source_type, pr_url, created_at, submission_count, last_submitted_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    if (body.source_type === "github_pr") {
      const ref = parsePrUrl(body.pr_url ?? "");
      if (!ref) {
        return NextResponse.json(
          { error: "PR URLの形式が正しくありません (例: https://github.com/owner/repo/pull/123)" },
          { status: 400 }
        );
      }

      const [meta, diff, modelComments] = await Promise.all([
        fetchPrMeta(ref),
        fetchPrDiff(ref),
        fetchPrReviewComments(ref),
      ]);

      // 演習 + 模範レビューコメントを 1 トランザクションで登録する (RPC)
      const { data: exerciseId, error } = await supabase.rpc("create_github_exercise", {
        p_title: body.title?.trim() || `${ref.owner}/${ref.repo}#${ref.number} ${meta.title}`,
        p_pr_url: body.pr_url.trim(),
        p_diff: diff,
        p_model_comments: modelComments as unknown as Json,
      });
      if (error) throw new Error(error.message);

      return NextResponse.json({ id: exerciseId, model_comment_count: modelComments.length });
    }

    // manual
    const title = body.title?.trim();
    const diff = body.diff_content?.trim();
    if (!title || !diff) {
      return NextResponse.json(
        { error: "タイトルと差分 (またはコード) は必須です" },
        { status: 400 }
      );
    }
    const { data, error } = await supabase
      .from("exercises")
      .insert({ title, source_type: "manual", pr_url: null, diff_content: diff })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ id: data.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "登録に失敗しました" },
      { status: 500 }
    );
  }
}
