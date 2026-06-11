import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// 認証なしの個人ツールのため、DB アクセスはすべてサーバー側に限定し、
// RLS をバイパスできる service_role キーで接続する。
// このモジュールは "server-only" によりクライアントバンドルへの混入を防いでいる
// (= service_role キーがブラウザに漏れない)。
//
// 必要な環境変数:
//   NEXT_PUBLIC_SUPABASE_URL      … プロジェクト URL (例: https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY     … service_role シークレットキー (Dashboard > Settings > API)

let client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (client) return client;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase の接続情報が設定されていません。NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を環境変数に設定してください。"
    );
  }

  // service_role はステートレスなのでモジュールシングルトンとして使い回す。
  client = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// 初期化 (および環境変数チェック) を初回アクセスまで遅延させる。
// これにより、環境変数が未設定でも `next build` のモジュール評価で落ちない。
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    // receiver (= Proxy) を渡すと、SupabaseClient のゲッター/メソッド内で
    // this が Proxy を指し、プライベートフィールドアクセスで TypeError になる。
    // 必ず実インスタンスを receiver として解決し、メソッドも実インスタンスに束縛する。
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
