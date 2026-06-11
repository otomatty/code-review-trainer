import { supabase } from "./supabase";

// 設定 (APIトークン等) ストア。Supabase の settings テーブルに保存する。
// RLS 有効 + service_role アクセスのため anon からは読めない。

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function deleteSetting(key: string): Promise<void> {
  const { error } = await supabase.from("settings").delete().eq("key", key);
  if (error) throw new Error(error.message);
}
