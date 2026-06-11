import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting, deleteSetting } from "@/lib/db";

function mask(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "…" + value.slice(-4);
}

export async function GET() {
  try {
    const [githubToken, anthropicKey] = await Promise.all([
      getSetting("github_token"),
      getSetting("anthropic_api_key"),
    ]);
    return NextResponse.json({
      github_token: mask(githubToken),
      anthropic_api_key: mask(anthropicKey),
      github_token_env: !!process.env.GITHUB_TOKEN,
      anthropic_api_key_env: !!process.env.ANTHROPIC_API_KEY,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "設定の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    for (const key of ["github_token", "anthropic_api_key"] as const) {
      if (typeof body[key] === "string") {
        const v = body[key].trim();
        if (v === "") {
          await deleteSetting(key);
        } else {
          await setSetting(key, v);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "設定の更新に失敗しました" },
      { status: 500 }
    );
  }
}
