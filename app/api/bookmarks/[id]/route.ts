import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseId } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookmarkId = parseId(id);
  if (bookmarkId === null) {
    return NextResponse.json({ error: "IDが不正です" }, { status: 400 });
  }
  const body = await req.json();

  if (typeof body.is_read === "boolean") {
    if (body.is_read) {
      const { data: bm, error } = await supabase
        .from("bookmarks")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", bookmarkId)
        .select("title")
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      // 読了も学習ログに記録 (読む習慣化)
      // studied_on はアプリ全体で UTC 基準に統一している (submit_review の current_date / streak.ts と整合)
      const today = new Date().toISOString().slice(0, 10);
      const { error: logError } = await supabase.from("study_logs").insert({
        exercise_id: null,
        submission_id: null,
        studied_on: today,
        memo: `PR読了: ${bm?.title ?? ""}`,
      });
      if (logError) {
        return NextResponse.json({ error: logError.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .update({ is_read: false, read_at: null })
        .eq("id", bookmarkId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookmarkId = parseId(id);
  if (bookmarkId === null) {
    return NextResponse.json({ error: "IDが不正です" }, { status: 400 });
  }
  const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
