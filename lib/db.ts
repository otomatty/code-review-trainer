import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(path.join(dataDir, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  migrate(db);
  seedChecklist(db);

  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK (source_type IN ('github_pr', 'manual')),
      pr_url TEXT,
      diff_content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS review_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      duration_min INTEGER,
      self_score INTEGER,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS review_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL REFERENCES review_submissions(id) ON DELETE CASCADE,
      checklist_item_id INTEGER REFERENCES checklist_items(id) ON DELETE SET NULL,
      file_path TEXT NOT NULL,
      line_no INTEGER NOT NULL,
      body TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS model_review_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      file_path TEXT NOT NULL,
      line_no INTEGER,
      body TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL REFERENCES review_submissions(id) ON DELETE CASCADE,
      scores_by_category TEXT NOT NULL,
      commentary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
      submission_id INTEGER REFERENCES review_submissions(id) ON DELETE SET NULL,
      studied_on TEXT NOT NULL,
      memo TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pr_url TEXT NOT NULL,
      title TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      read_at TEXT
    );
  `);
}

const DEFAULT_CHECKLIST: { category: string; label: string }[] = [
  { category: "correctness", label: "仕様どおりに動作するか(境界値・null・空配列)" },
  { category: "correctness", label: "条件分岐・ロジックに誤りはないか" },
  { category: "correctness", label: "並行処理・競合状態の考慮はあるか" },
  { category: "security", label: "入力値のバリデーション・サニタイズはあるか" },
  { category: "security", label: "SQLインジェクション・XSS等の脆弱性はないか" },
  { category: "security", label: "秘密情報(トークン・パスワード)がハードコードされていないか" },
  { category: "security", label: "認可チェックの抜け漏れはないか" },
  { category: "performance", label: "N+1クエリ・不要なループはないか" },
  { category: "performance", label: "大量データ時のメモリ・計算量は問題ないか" },
  { category: "performance", label: "不要な再計算・再レンダリングはないか" },
  { category: "readability", label: "命名は意図を表しているか" },
  { category: "readability", label: "関数・クラスの責務は適切に分割されているか" },
  { category: "readability", label: "マジックナンバー・重複コードはないか" },
  { category: "testing", label: "変更に対するテストが追加・更新されているか" },
  { category: "testing", label: "テストは境界値・異常系をカバーしているか" },
  { category: "error_handling", label: "例外・エラーは適切に処理されているか" },
  { category: "error_handling", label: "失敗時のリソース解放・ロールバックはあるか" },
  { category: "error_handling", label: "エラーメッセージ・ログは調査に役立つ内容か" },
];

function seedChecklist(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM checklist_items").get() as { c: number };
  if (count.c > 0) return;
  const insert = db.prepare(
    "INSERT INTO checklist_items (category, label, active) VALUES (?, ?, 1)"
  );
  const tx = db.transaction(() => {
    for (const item of DEFAULT_CHECKLIST) insert.run(item.category, item.label);
  });
  tx();
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}

export function deleteSetting(key: string) {
  getDb().prepare("DELETE FROM settings WHERE key = ?").run(key);
}
