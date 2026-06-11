import Anthropic from "@anthropic-ai/sdk";
import { getSetting } from "./db";
import { CHECKLIST_CATEGORIES } from "./types";

export interface AiReviewScores {
  scores: { category: string; score: number; missed_points: string[] }[];
  commentary: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: CHECKLIST_CATEGORIES.map((c) => c.key),
          },
          score: { type: "integer", enum: [0, 1, 2, 3, 4, 5] },
          missed_points: { type: "array", items: { type: "string" } },
        },
        required: ["category", "score", "missed_points"],
        additionalProperties: false,
      },
    },
    commentary: { type: "string" },
  },
  required: ["scores", "commentary"],
  additionalProperties: false,
} as const;

export async function generateAiFeedback(input: {
  diff: string;
  userComments: { file_path: string; line_no: number; category: string | null; body: string }[];
}): Promise<AiReviewScores> {
  const apiKey =
    (await getSetting("anthropic_api_key")) || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Anthropic APIキーが設定されていません。設定画面または環境変数 ANTHROPIC_API_KEY で設定してください。"
    );
  }

  const client = new Anthropic({ apiKey });

  const categories = CHECKLIST_CATEGORIES.map((c) => `${c.key} (${c.label})`).join(", ");
  const commentsText =
    input.userComments.length === 0
      ? "(指摘なし)"
      : input.userComments
          .map(
            (c, i) =>
              `${i + 1}. [${c.category ?? "未分類"}] ${c.file_path}:${c.line_no}\n${c.body}`
          )
          .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system:
      "あなたはシニアソフトウェアエンジニアであり、コードレビューのコーチです。" +
      "学習者が書いたレビューコメントを差分と照らし合わせて評価し、観点別の抜け漏れを採点・講評してください。" +
      "講評は日本語で、具体的な行・コードを引用しながら「何を見逃したか」「どう指摘すべきだったか」を教えてください。",
    messages: [
      {
        role: "user",
        content:
          `以下のコード差分に対して、学習者がレビュー演習を行いました。\n\n` +
          `## コード差分\n\`\`\`diff\n${input.diff.slice(0, 200_000)}\n\`\`\`\n\n` +
          `## 学習者のレビューコメント\n${commentsText}\n\n` +
          `## 評価方法\n` +
          `観点カテゴリ: ${categories}\n` +
          `各カテゴリについて 0〜5 点で採点してください (5 = その観点の重要な問題をすべて指摘できている / 0 = 重要な問題を完全に見逃している。差分にその観点の問題が存在しない場合は 5)。\n` +
          `missed_points には学習者が見逃した具体的な指摘事項を日本語で列挙してください (見逃しがなければ空配列)。\n` +
          `commentary には全体講評 (良かった点・改善点・次に意識すべきこと) を日本語で書いてください。`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  if (response.stop_reason === "refusal") {
    throw new Error("AIが採点を実行できませんでした。別の題材でお試しください。");
  }

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("AIから有効な応答が得られませんでした。");
  }

  return JSON.parse(text.text) as AiReviewScores;
}
