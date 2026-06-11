import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .order("category")
    .order("id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const category = body.category?.trim();
  const label = body.label?.trim();
  if (!category || !label) {
    return NextResponse.json({ error: "カテゴリとラベルは必須です" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("checklist_items")
    .insert({ category, label, active: true })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
