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
  active: number; // SQLite boolean (0/1)
}

export interface ModelReviewComment {
  id: number;
  exercise_id: number;
  author: string;
  file_path: string;
  line_no: number | null;
  body: string;
}

export interface AiFeedback {
  id: number;
  submission_id: number;
  scores_by_category: string; // JSON string
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
  is_read: number; // 0/1
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
