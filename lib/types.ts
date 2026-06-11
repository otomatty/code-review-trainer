export type SourceType = "github_pr" | "manual";

export interface Exercise {
  id: number;
  title: string;
  source_type: SourceType;
  pr_url: string | null;
  diff_content: string;
  created_at: string;
}

export interface ReviewSubmission {
  id: number;
  exercise_id: number;
  duration_min: number | null;
  self_score: number | null;
  submitted_at: string;
}

export interface ReviewComment {
  id: number;
  submission_id: number;
  checklist_item_id: number | null;
  file_path: string;
  line_no: number;
  body: string;
}

export interface ChecklistItem {
  id: number;
  category: string;
  label: string;
  active: boolean;
}

export interface ModelReviewComment {
  id: number;
  exercise_id: number;
  author: string;
  file_path: string;
  line_no: number | null;
  body: string;
}

export interface AiScore {
  category: string;
  score: number;
  missed_points: string[];
}

export interface AiFeedback {
  id: number;
  submission_id: number;
  scores_by_category: AiScore[]; // jsonb (Postgres でパース済みオブジェクト)
  commentary: string;
  created_at: string;
}

export interface StudyLog {
  id: number;
  exercise_id: number | null;
  submission_id: number | null;
  studied_on: string; // YYYY-MM-DD
  memo: string | null;
}

export interface Bookmark {
  id: number;
  pr_url: string;
  title: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export const CHECKLIST_CATEGORIES = [
  { key: "correctness", label: "正確性" },
  { key: "security", label: "セキュリティ" },
  { key: "performance", label: "性能" },
  { key: "readability", label: "可読性" },
  { key: "testing", label: "テスト" },
  { key: "error_handling", label: "エラーハンドリング" },
] as const;

export function categoryLabel(key: string): string {
  return CHECKLIST_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** Postgres の timestamptz (ISO文字列) を "YYYY-MM-DD HH:MM" 形式 (UTC) に整形する。
 *  アプリ全体で日付を UTC 基準に統一しているため、表示もサーバーTZに依存しない UTC とする。 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** ルートパラメータの id を正の整数に変換する。不正なら null を返す (呼び出し側で 400 を返す)。 */
export function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}
