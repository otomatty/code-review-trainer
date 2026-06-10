import { getDb } from "./db";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** study_logs から連続学習日数を計算する (今日または昨日を起点に遡る) */
export function calcStreak(): number {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT studied_on FROM study_logs ORDER BY studied_on DESC")
    .all() as { studied_on: string }[];
  if (rows.length === 0) return 0;

  const days = new Set(rows.map((r) => r.studied_on));
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

export function studiedDates(): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT studied_on FROM study_logs ORDER BY studied_on")
    .all() as { studied_on: string }[];
  return rows.map((r) => r.studied_on);
}
