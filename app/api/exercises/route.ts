import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  parsePrUrl,
  fetchPrMeta,
  fetchPrDiff,
  fetchPrReviewComments,
} from "@/lib/github";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT e.id, e.title, e.source_type, e.pr_url, e.created_at,
              COUNT(s.id) AS submission_count,
              MAX(s.submitted_at) AS last_submitted_at
       FROM exercises e
       LEFT JOIN review_submissions s ON s.exercise_id = e.id
       GROUP BY e.id
       ORDER BY e.created_at DESC`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

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

      const result = db
        .prepare(
          "INSERT INTO exercises (title, source_type, pr_url, diff_content) VALUES (?, 'github_pr', ?, ?)"
        )
        .run(
          body.title?.trim() || `${ref.owner}/${ref.repo}#${ref.number} ${meta.title}`,
          body.pr_url.trim(),
          diff
        );
      const exerciseId = result.lastInsertRowid as number;

      const insertModel = db.prepare(
        "INSERT INTO model_review_comments (exercise_id, author, file_path, line_no, body) VALUES (?, ?, ?, ?, ?)"
      );
      const tx = db.transaction(() => {
        for (const c of modelComments) {
          insertModel.run(exerciseId, c.author, c.file_path, c.line_no, c.body);
        }
      });
      tx();

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
    const result = db
      .prepare(
        "INSERT INTO exercises (title, source_type, pr_url, diff_content) VALUES (?, 'manual', NULL, ?)"
      )
      .run(title, diff);
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "登録に失敗しました" },
      { status: 500 }
    );
  }
}
