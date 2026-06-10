import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parsePrUrl, fetchPrMeta } from "@/lib/github";

export async function GET() {
  const rows = getDb()
    .prepare("SELECT * FROM bookmarks ORDER BY is_read ASC, created_at DESC")
    .all();
  return NextResponse.json(rows);
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

  const result = getDb()
    .prepare("INSERT INTO bookmarks (pr_url, title) VALUES (?, ?)")
    .run(url, title);
  return NextResponse.json({ id: result.lastInsertRowid });
}
