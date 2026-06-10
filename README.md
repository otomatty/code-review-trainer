# コードレビュー・トレーナー

コードレビュー能力を最短で鍛えるための、自分専用トレーニングWebアプリ。
詳細な要件は [PRD_code-review-trainer.md](./PRD_code-review-trainer.md) を参照。

## 機能

| ID | 機能 | 状態 |
|---|---|---|
| F-01 | 演習題材の登録 (GitHub PR取り込み / 手動登録) | ✅ |
| F-02 | レビュー演習 (差分表示 + 行コメント) | ✅ |
| F-03 | 観点チェックリスト (常時表示 + 観点タグ付与) | ✅ |
| F-04 | 模範との比較 (マージ済みレビューコメントとの対比) | ✅ |
| F-05 | 学習ログ (カレンダー + ストリーク) | ✅ |
| F-06 | AIフィードバック (Claude APIで観点別採点・講評) | ✅ |
| F-07 | OSS PRブックマーク (読了管理) | ✅ |
| F-08 | 弱点分析 (ダッシュボードに観点別平均スコア表示) | ✅ 簡易版 |
| F-09 | 復習 (間隔反復) | 未実装 |

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。

### 本番ビルド

```bash
npm run build
npm start
```

## 設定

設定画面 (`/settings`) または環境変数でトークンを登録できます。

| 項目 | 環境変数 | 用途 |
|---|---|---|
| GitHubトークン | `GITHUB_TOKEN` | PR差分・レビューコメント取得 (未設定でも動くがレート制限が厳しい) |
| Anthropic APIキー | `ANTHROPIC_API_KEY` | AIフィードバック (F-06) |

## 使い方

1. **題材を登録** — `/exercises/new` でGitHubのPR URLを取り込むか、`git diff` の出力を手動で貼り付ける
2. **レビュー演習** — 差分の行をクリックしてコメントを記入。右側の観点チェックリストで抜け漏れを確認しながら進める
3. **提出して答え合わせ** — 自分の指摘と実PRの模範レビューが行単位で対比表示される
4. **AIフィードバック** — 結果画面からClaudeに観点別の採点・講評を依頼できる
5. **継続** — 提出すると学習ログに自動記録され、カレンダーとストリークで習慣化を支援

## 技術構成

- **フレームワーク**: Next.js (App Router) + TypeScript + Tailwind CSS
- **DB**: SQLite (better-sqlite3) — `data/app.db` に自動作成 (gitignore済み)
- **外部連携**: GitHub REST API / Anthropic Claude API (構造化出力)

### データのバックアップ

DBはファイル1つなので `data/app.db` をコピーするだけでバックアップできます。

## ディレクトリ構成

```
app/              # 画面 + API Routes
  api/            # exercises / submissions / checklist / settings / bookmarks
  exercises/      # 演習一覧・登録・演習画面 (S-02, S-03)
  results/        # 結果比較 (S-04)
  logs/           # 学習ログ (S-05)
  bookmarks/      # PRブックマーク (F-07)
  settings/       # 設定 (S-06)
lib/
  db.ts           # SQLiteスキーマ・シード・設定ストア
  diff.ts         # unified diffパーサー
  github.ts       # GitHub API連携 (PR差分・レビューコメント取得)
  ai.ts           # Claude APIによる採点 (構造化出力)
  streak.ts       # ストリーク計算
  types.ts        # 共有型・観点カテゴリ定義
```
