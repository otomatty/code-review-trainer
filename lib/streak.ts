import { supabase } from "./supabase";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** studied_dates_view (distinct studied_on) を取得する */
async function fetchStudiedDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from("studied_dates_view")
    .select("studied_on")
    .order("studied_on", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((r) => r.studied_on)
    .filter((d): d is string => d != null);
}

/** study_logs から連続学習日数を計算する (今日または昨日を起点に遡る) */
export async function calcStreak(): Promise<number> {
  const dates = await fetchStudiedDates();
  if (dates.length === 0) return 0;

  const days = new Set(dates);
  const today = new Date();
  let cursor: Date;

  if (days.has(toDateStr(today))) {
    cursor = today;
  } else {
    const yesterday = new Date(today.getTime() - 86400000);
    if (days.has(toDateStr(yesterday))) {
      cursor = yesterday;
    } else {
      return 0;
    }
  }

  let streak = 0;
  while (days.has(toDateStr(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

export async function studiedDates(): Promise<string[]> {
  return fetchStudiedDates();
}
