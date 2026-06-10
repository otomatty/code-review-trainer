import { describe, it, expect } from "bun:test";
import { parseDiff } from "./diff";

describe("parseDiff", () => {
  it("追加・削除・文脈行をハンクから正しく分類する", () => {
    const diff = [
      "diff --git a/src/foo.ts b/src/foo.ts",
      "index 1111111..2222222 100644",
      "--- a/src/foo.ts",
      "+++ b/src/foo.ts",
      "@@ -1,3 +1,3 @@",
      " const a = 1;",
      "-const b = 2;",
      "+const b = 3;",
      " const c = 4;",
    ].join("\n");

    const files = parseDiff(diff);
    expect(files).toHaveLength(1);
    expect(files[0].filePath).toBe("src/foo.ts");

    const types = files[0].lines.map((l) => l.type);
    expect(types).toEqual(["hunk", "context", "del", "add", "context"]);

    const add = files[0].lines.find((l) => l.type === "add")!;
    const del = files[0].lines.find((l) => l.type === "del")!;
    // 追加行は新ファイル側、削除行は旧ファイル側の行番号を comment 用に保持する
    expect(add.commentLineNo).toBe(add.newLineNo);
    expect(add.oldLineNo).toBeNull();
    expect(del.commentLineNo).toBe(del.oldLineNo);
    expect(del.newLineNo).toBeNull();
  });

  it("複数ファイルの差分をファイル単位に分割する", () => {
    const diff = [
      "diff --git a/a.ts b/a.ts",
      "--- a/a.ts",
      "+++ b/a.ts",
      "@@ -1 +1 @@",
      "-x",
      "+y",
      "diff --git a/b.ts b/b.ts",
      "--- a/b.ts",
      "+++ b/b.ts",
      "@@ -1 +1 @@",
      "-p",
      "+q",
    ].join("\n");

    const files = parseDiff(diff);
    expect(files.map((f) => f.filePath)).toEqual(["a.ts", "b.ts"]);
  });

  it("diff --git ヘッダ無しの貼り付け差分を扱える", () => {
    const diff = ["@@ -1,2 +1,2 @@", " keep", "-old", "+new"].join("\n");

    const files = parseDiff(diff);
    expect(files).toHaveLength(1);
    expect(files[0].filePath).toBe("(pasted diff)");
    expect(files[0].lines.some((l) => l.type === "add" && l.content === "new")).toBe(true);
  });

  it("空入力では空配列を返す", () => {
    expect(parseDiff("")).toEqual([]);
  });
});
