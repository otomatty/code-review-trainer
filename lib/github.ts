import { getSetting } from "./db";

export interface PrRef {
  owner: string;
  repo: string;
  number: number;
}

export function parsePrUrl(url: string): PrRef | null {
  const m = url
    .trim()
    .match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: parseInt(m[3], 10) };
}

function githubHeaders(accept: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "code-review-trainer",
  };
  const token = getSetting("github_token") || process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function ghFetch(url: string, accept: string): Promise<Response> {
  const res = await fetch(url, { headers: githubHeaders(accept) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `GitHub API エラー (${res.status}): ${url}\n${body.slice(0, 300)}`
    );
  }
  return res;
}

export interface PrMeta {
  title: string;
  body: string | null;
  state: string;
  merged: boolean;
}

export async function fetchPrMeta(ref: PrRef): Promise<PrMeta> {
  const res = await ghFetch(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}`,
    "application/vnd.github+json"
  );
  const json = await res.json();
  return {
    title: json.title,
    body: json.body,
    state: json.state,
    merged: !!json.merged,
  };
}

export async function fetchPrDiff(ref: PrRef): Promise<string> {
  const res = await ghFetch(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}`,
    "application/vnd.github.v3.diff"
  );
  return res.text();
}

export interface FetchedReviewComment {
  author: string;
  file_path: string;
  line_no: number | null;
  body: string;
}

/** マージ済みPRのレビューコメント (行コメント + レビュー本文) を取得する */
export async function fetchPrReviewComments(
  ref: PrRef
): Promise<FetchedReviewComment[]> {
  const comments: FetchedReviewComment[] = [];

  // 行単位のレビューコメント
  const res = await ghFetch(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}/comments?per_page=100`,
    "application/vnd.github+json"
  );
  const rows = (await res.json()) as Array<{
    user?: { login?: string };
    path: string;
    line: number | null;
    original_line: number | null;
    body: string;
  }>;
  for (const c of rows) {
    comments.push({
      author: c.user?.login ?? "unknown",
      file_path: c.path,
      line_no: c.line ?? c.original_line ?? null,
      body: c.body,
    });
  }

  // レビューサマリ (本文があるもののみ)
  const reviewsRes = await ghFetch(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}/reviews?per_page=100`,
    "application/vnd.github+json"
  );
  const reviews = (await reviewsRes.json()) as Array<{
    user?: { login?: string };
    body: string | null;
    state: string;
  }>;
  for (const r of reviews) {
    if (r.body && r.body.trim()) {
      comments.push({
        author: r.user?.login ?? "unknown",
        file_path: "(レビュー全体)",
        line_no: null,
        body: `[${r.state}] ${r.body}`,
      });
    }
  }

  return comments;
}
