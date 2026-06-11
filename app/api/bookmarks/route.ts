import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parsePrUrl, fetchPrMeta } from "@/lib/github";

export async function GET() {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = (body.pr_url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "PR URLは必須です" }, { status: 400 });
  }

  let title = body.title?.trim() || "";
  if (!title) {
    const ref = parsePrUrl(url);
    if (ref) {
      try {
        const meta = await fetchPrMeta(ref);
        title = `${ref.owner}/${ref.repo}#${ref.number} ${meta.title}`;
      } catch {
        title = url;
      }
    } else {
      title = url;
    }
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ pr_url: url, title })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
