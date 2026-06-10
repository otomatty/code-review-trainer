// unified diff パーサー。差分テキストをファイル → 行の構造に変換する。
// 行番号は GitHub のレビューコメントと対応させるため「新ファイル側の行番号」
// (削除行のみ旧ファイル側) を保持する。

export type DiffLineType = "add" | "del" | "context" | "hunk";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNo: number | null;
  newLineNo: number | null;
  /** コメントを紐付けるための行番号 (追加・文脈行: 新行番号 / 削除行: 旧行番号) */
  commentLineNo: number | null;
}

export interface DiffFile {
  filePath: string;
  oldPath: string;
  newPath: string;
  lines: DiffLine[];
}

export function parseDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: DiffFile | null = null;
  let oldLine = 0;
  let newLine = 0;

  const lines = diffText.split("\n");

  for (const raw of lines) {
    if (raw.startsWith("diff --git ")) {
      // "diff --git a/path b/path"
      const m = raw.match(/^diff --git a\/(.+?) b\/(.+)$/);
      current = {
        filePath: m ? m[2] : raw.slice("diff --git ".length),
        oldPath: m ? m[1] : "",
        newPath: m ? m[2] : "",
        lines: [],
      };
      files.push(current);
      continue;
    }

    if (!current) {
      // diff --git ヘッダなしで始まる差分 (手動貼り付け等) に対応
      if (raw.startsWith("--- ") || raw.startsWith("+++ ") || raw.startsWith("@@")) {
        current = { filePath: "(pasted diff)", oldPath: "", newPath: "", lines: [] };
        files.push(current);
      } else {
        continue;
      }
    }

    if (raw.startsWith("--- ")) {
      const p = raw.slice(4).trim();
      if (p !== "/dev/null") current.oldPath = p.replace(/^a\//, "");
      continue;
    }
    if (raw.startsWith("+++ ")) {
      const p = raw.slice(4).trim();
      if (p !== "/dev/null") {
        current.newPath = p.replace(/^b\//, "");
        current.filePath = current.newPath;
      }
      continue;
    }
    if (raw.startsWith("index ") || raw.startsWith("new file") || raw.startsWith("deleted file") ||
        raw.startsWith("similarity ") || raw.startsWith("rename ") || raw.startsWith("old mode") ||
        raw.startsWith("new mode") || raw.startsWith("Binary files")) {
      continue;
    }

    if (raw.startsWith("@@")) {
      const m = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        oldLine = parseInt(m[1], 10);
        newLine = parseInt(m[2], 10);
      }
      current.lines.push({
        type: "hunk",
        content: raw,
        oldLineNo: null,
        newLineNo: null,
        commentLineNo: null,
      });
      continue;
    }

    if (raw.startsWith("+")) {
      current.lines.push({
        type: "add",
        content: raw.slice(1),
        oldLineNo: null,
        newLineNo: newLine,
        commentLineNo: newLine,
      });
      newLine++;
    } else if (raw.startsWith("-")) {
      current.lines.push({
        type: "del",
        content: raw.slice(1),
        oldLineNo: oldLine,
        newLineNo: null,
        commentLineNo: oldLine,
      });
      oldLine++;
    } else if (raw.startsWith(" ") || raw === "") {
      // ハンク内の文脈行のみ追加 (行カウンタが動いている場合)
      if (current.lines.length > 0) {
        current.lines.push({
          type: "context",
          content: raw.slice(1),
          oldLineNo: oldLine,
          newLineNo: newLine,
          commentLineNo: newLine,
        });
        oldLine++;
        newLine++;
      }
    }
    // "\ No newline at end of file" などは無視
  }

  return files.filter((f) => f.lines.length > 0);
}
